import os
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity

# Initialize Flask app
app = Flask(__name__, static_folder='website', static_url_path='')

# Global variables for models
pipeline = None
location_df = None
location_df_normalized = None
cosine_sim_matrix = None
appartments_df = None
analysis_df = None

def load_models():
    global pipeline, location_df, location_df_normalized, cosine_sim_matrix, appartments_df, analysis_df
    try:
        print("Loading pipeline.pkl...")
        with open('pipeline.pkl', 'rb') as f:
            pipeline = pickle.load(f)
        
        print("Loading location_distance.pkl...")
        with open('location_distance.pkl', 'rb') as f:
            location_df = pickle.load(f)
            
        print("Loading appartments.csv...")
        if os.path.exists('appartments.csv'):
            appartments_df = pd.read_csv('appartments.csv')
            
        # Precompute cosine similarity matrix for location distance
        if location_df is not None:
            scaler = StandardScaler()
            location_df_normalized = pd.DataFrame(
                scaler.fit_transform(location_df), 
                columns=location_df.columns, 
            )
            cosine_sim_matrix = cosine_similarity(location_df_normalized)
            
        print("Loading gurgaon_properties_post_feature_selection_v2.csv for analysis...")
        if os.path.exists('gurgaon_properties_post_feature_selection_v2.csv'):
            analysis_df = pd.read_csv('gurgaon_properties_post_feature_selection_v2.csv')
            
        print("All models loaded successfully!")
    except Exception as e:
        print(f"Error loading models: {e}")

load_models()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Map frontend data to dataframe columns expected by pipeline
        # Expected columns: ['property_type', 'sector', 'bedRoom', 'bathroom', 'balcony', 
        # 'agePossession', 'built_up_area', 'servant room', 'store room', 
        # 'furnishing_type', 'luxury_category', 'floor_category']
        
        # Furnishing type mapping
        furnish_map = {'0': 'unfurnished', '1': 'semifurnished', '2': 'furnished'}
        furnish_val = data.get('furnishing_type', '0')
        if furnish_val in furnish_map:
            furnish_val = furnish_map[furnish_val]
            
        row = {
            'property_type': data.get('property_type', 'flat'),
            'sector': data.get('sector', 'sector 102'),
            'bedRoom': int(data.get('bedRoom', 2)),
            'bathroom': int(data.get('bathroom', 2)),
            'balcony': str(data.get('balcony', '2')),
            'agePossession': data.get('agePossession', 'Relatively New'),
            'built_up_area': float(data.get('built_up_area', 1000.0)),
            'servant room': 1 if data.get('servant_room') else 0,
            'store room': 1 if data.get('store_room') else 0,
            'furnishing_type': furnish_val,
            'luxury_category': data.get('luxury_category', 'Medium'),
            'floor_category': data.get('floor_category', 'Mid floor')
        }
        
        df = pd.DataFrame([row])
        
        # Execute prediction
        pred_log = pipeline.predict(df)
        pred_price = np.expm1(pred_log)[0]
        
        # Ensure non-negative/reasonable bounds
        pred_price = max(0.1, float(pred_price))
        
        return jsonify({
            'success': True,
            'price': pred_price,
            'currency': 'Cr'
        })
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recommend', methods=['POST'])
def recommend():
    try:
        data = request.get_json() or {}
        target_sector = data.get('sector', '').lower().strip()
        
        if location_df is None or cosine_sim_matrix is None or appartments_df is None:
            return jsonify({'success': False, 'error': 'Models not loaded'}), 500
            
        # 1. Find a target property in appartments_df that matches the sector
        target_prop_name = None
        if target_sector:
            # Match sector string in PropertySubName
            matches = appartments_df[appartments_df['PropertySubName'].str.lower().str.contains(target_sector, na=False)]
            for idx, row in matches.iterrows():
                prop_name = row['PropertyName']
                if prop_name in location_df_normalized.index:
                    target_prop_name = prop_name
                    break
                    
        # Fallback to a well-known premium property if no exact sector match is found in index
        if not target_prop_name:
            fallbacks = ['Smartworld One DXP', 'DLF The Camellias', 'M3M Crown', 'Sobha City']
            for f in fallbacks:
                if f in location_df_normalized.index:
                    target_prop_name = f
                    break
                    
        if not target_prop_name:
            target_prop_name = location_df_normalized.index[0]
            
        # 2. Get similarity scores
        prop_idx = location_df_normalized.index.get_loc(target_prop_name)
        sim_scores = list(enumerate(cosine_sim_matrix[prop_idx]))
        
        # Sort properties based on similarity scores
        sorted_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        
        # Take top 6 recommendations
        top_recommendations = []
        for i, score in sorted_scores[:6]:
            rec_name = location_df_normalized.index[i]
            # Convert similarity score to a clean percentage match
            match_pct = int(min(98, max(65, (score * 40) + 60)))
            
            # Look up details in appartments_df
            match_rows = appartments_df[appartments_df['PropertyName'] == rec_name]
            location_sub = f"{target_sector.title()}, Gurgaon"
            price_details = "₹ 1.50 Cr - 3.50 Cr"
            tags = ["Swimming Pool", "Club House", "Gymnasium"]
            
            if not match_rows.empty:
                row_data = match_rows.iloc[0]
                if pd.notna(row_data.get('PropertySubName')):
                    location_sub = str(row_data['PropertySubName'])
                if pd.notna(row_data.get('TopFacilities')):
                    fac_str = str(row_data['TopFacilities'])
                    clean_tags = [t.strip().strip("'").strip('"') for t in fac_str.replace('[','').replace(']','').split(',') if t.strip()]
                    if len(clean_tags) >= 3:
                        tags = clean_tags[:3]
                        
            top_recommendations.append({
                'name': rec_name,
                'location': location_sub,
                'price': price_details,
                'match': match_pct,
                'tags': tags
            })
            
        return jsonify({
            'success': True,
            'recommendations': top_recommendations
        })
        
    except Exception as e:
        print(f"Recommender error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analysis', methods=['GET'])
def get_analysis():
    try:
        if analysis_df is None:
            return jsonify({'success': False, 'error': 'Analysis data not loaded'}), 500
            
        # 1. Top 10 most expensive sectors by average price
        sector_prices = analysis_df.groupby('sector')['price'].mean().sort_values(ascending=False).head(10)
        top_sectors = {
            'labels': sector_prices.index.tolist(),
            'values': [round(x, 2) for x in sector_prices.values.tolist()]
        }
        
        # 2. Property Type Distribution (Flat vs House)
        prop_types = analysis_df['property_type'].value_counts()
        type_distribution = {
            'labels': prop_types.index.str.title().tolist(),
            'values': prop_types.values.tolist()
        }
        
        # 3. Scatter Plot Data (Built-up Area vs Price)
        # Taking a random sample of 300 to avoid overwhelming the frontend chart
        scatter_sample = analysis_df[['built_up_area', 'price']].dropna().sample(min(300, len(analysis_df)), random_state=42)
        scatter_data = [
            {'x': row['built_up_area'], 'y': row['price']} 
            for _, row in scatter_sample.iterrows()
        ]
        
        # 4. KPIs
        kpis = {
            'total_properties': len(analysis_df),
            'avg_price': round(analysis_df['price'].mean(), 2),
            'avg_area': int(analysis_df['built_up_area'].mean())
        }
        
        return jsonify({
            'success': True,
            'top_sectors': top_sectors,
            'type_distribution': type_distribution,
            'scatter_data': scatter_data,
            'kpis': kpis
        })
    except Exception as e:
        print(f"Analysis API error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
