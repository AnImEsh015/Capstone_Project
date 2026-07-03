/* ==========================================================================
   AnalysisView Module — Market Analysis Dashboard (Extended)
   ========================================================================== */

const AnalysisView = {
  container: null,
  charts: {},
  extendedData: null,

  init() {
    this.container = document.getElementById('analysis-view');
    const btnOpenAnalysis = document.getElementById('btn-open-analysis');
    if (btnOpenAnalysis) {
      btnOpenAnalysis.addEventListener('click', () => {
        if (window.appInstance) window.appInstance.showAnalysisView();
      });
    }
  },

  async render() {
    this.container.innerHTML = `
      <button class="btn-back" onclick="appInstance.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back
      </button>
      
      <div class="analysis-header" style="margin-bottom: 2rem;">
        <h2 style="font-family: var(--font-heading, Outfit); font-size: 2.2rem; color: var(--text-primary); margin-bottom: 0.5rem;">Market Analysis</h2>
        <p style="color: var(--text-secondary); max-width: 600px;">Explore data-driven insights from the Gurgaon real estate market.</p>
      </div>
      
      <div id="analysis-loading" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
        <div class="spinner"></div>
        <div style="margin-top:1rem;">Loading market data...</div>
      </div>
      
      <div id="analysis-content" style="display: none;">
        <!-- KPIs -->
        <div class="kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
          <div class="glass-card kpi-card" style="text-align: center;">
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Properties Analyzed</div>
            <div id="kpi-total" style="font-size: 2.5rem; font-weight: 700; color: var(--accent-primary);">--</div>
          </div>
          <div class="glass-card kpi-card" style="text-align: center;">
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Avg Market Price</div>
            <div id="kpi-price" style="font-size: 2.5rem; font-weight: 700; color: var(--accent-primary);">--</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Crores (Cr)</div>
          </div>
          <div class="glass-card kpi-card" style="text-align: center;">
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Avg Built-up Area</div>
            <div id="kpi-area" style="font-size: 2.5rem; font-weight: 700; color: var(--accent-primary);">--</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Sq. Ft.</div>
          </div>
        </div>

        <!-- Section 1: Spatial & General -->
        <div class="charts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom:1.5rem;">
          <!-- Mapbox Choropleth -->
          <div class="glass-card chart-container" style="position: relative; height: 500px; padding: 1.5rem; grid-column: 1 / -1;">
            <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary); font-weight: 600;">Sector Price Heatmap (Choropleth)</h3>
            <div id="chart-mapbox" style="width:100%; height:100%;"></div>
          </div>

          <div class="glass-card chart-container" style="position: relative; height: 350px; padding: 1.5rem;">
            <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary); font-weight: 600;">Top 10 Most Expensive Sectors</h3>
            <canvas id="chart-top-sectors"></canvas>
          </div>
          
          <div class="glass-card chart-container" style="position: relative; height: 350px; padding: 1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
              <h3 style="font-size: 1.1rem; color: var(--text-primary); font-weight: 600; margin:0;">Number of Rooms</h3>
              <select id="pie-sector" class="form-select" style="width:140px; margin:0; padding:0.2rem 0.5rem; font-size:0.9rem;" onchange="AnalysisView.updatePieChart()">
                <option value="Overall">Overall</option>
              </select>
            </div>
            <div style="height: calc(100% - 40px);"><canvas id="chart-type-distribution"></canvas></div>
          </div>
        </div>

        <!-- Section 2: Interactive Scatter Plot -->
        <div class="glass-card chart-container" style="position: relative; height: 500px; padding: 1.5rem; margin-bottom:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.1rem; color: var(--text-primary); font-weight: 600; margin:0;">Area vs Price</h3>
            <select id="scatter-prop-type" class="form-select" style="width:200px; margin:0;" onchange="AnalysisView.updateScatterPlot()">
              <option value="house">House</option>
              <option value="flat">Flat</option>
            </select>
          </div>
          <div id="chart-scatter-area" style="width:100%; height:90%;"></div>
        </div>

        <!-- Section 3: Distributions & Comparisons -->
        <div class="charts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom:1.5rem;">
          <div class="glass-card chart-container" style="position: relative; height: 400px; padding: 1.5rem;">
            <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary); font-weight: 600;">Side by Side BHK Price Comparison</h3>
            <div id="chart-boxplot" style="width:100%; height:100%;"></div>
          </div>

          <div class="glass-card chart-container" style="position: relative; height: 400px; padding: 1.5rem;">
            <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary); font-weight: 600;">Price Distribution by Property Type</h3>
            <div id="chart-distplot" style="width:100%; height:100%;"></div>
          </div>
        </div>

        <!-- Section 4: Word Cloud -->
        <div class="glass-card chart-container" style="position: relative; padding: 1.5rem; text-align:center;">
          <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary); font-weight: 600; text-align:left;">Word Cloud Map</h3>
          <div style="display:flex; gap:1rem; align-items:center; justify-content:center; margin-bottom:1.5rem;">
            <select id="wordcloud-sector" class="form-select" style="width:250px; margin:0;"></select>
            <button class="btn btn-primary" onclick="AnalysisView.fetchWordCloud()">Find Word Cloud</button>
          </div>
          <div id="wordcloud-loading" style="display:none; color: var(--text-secondary); margin:2rem 0;">Generating Word Cloud...</div>
          <img id="wordcloud-img" style="display:none; max-width:100%; border-radius:12px;" />
        </div>

      </div>
    `;

    try {
      // Fetch both APIs in parallel
      const [resBasic, resExt] = await Promise.all([
        fetch('/api/analysis'),
        fetch('/api/analysis/extended')
      ]);

      const basicData = await resBasic.json();
      const extData = await resExt.json();
      
      if (basicData.success && extData.success) {
        this.extendedData = extData; // Save for interactivity
        document.getElementById('analysis-loading').style.display = 'none';
        document.getElementById('analysis-content').style.display = 'block';
        
        this.populateKPIs(basicData.kpis);
        this.renderChartJS(basicData, extData);
        this.renderPlotly(extData);
        
        // Populate word cloud and pie chart sectors
        const wcSelect = document.getElementById('wordcloud-sector');
        const pieSelect = document.getElementById('pie-sector');
        extData.sectors.sort().forEach(sec => {
          const opt1 = document.createElement('option');
          opt1.value = sec;
          opt1.textContent = sec;
          wcSelect.appendChild(opt1);
          
          const opt2 = document.createElement('option');
          opt2.value = sec;
          opt2.textContent = sec;
          pieSelect.appendChild(opt2);
        });
      } else {
        throw new Error('Failed to load analysis data');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      document.getElementById('analysis-loading').innerHTML = `
        <div style="color: var(--danger);">Error loading market data. Please try again later.</div>
      `;
    }
  },

  populateKPIs(kpis) {
    document.getElementById('kpi-total').textContent = kpis.total_properties.toLocaleString();
    document.getElementById('kpi-price').textContent = `₹${kpis.avg_price}`;
    document.getElementById('kpi-area').textContent = kpis.avg_area.toLocaleString();
  },

  renderChartJS(basicData, extData) {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';
    Chart.defaults.font.family = 'Inter, sans-serif';

    // 1. Top Sectors Bar Chart
    const ctxBar = document.getElementById('chart-top-sectors').getContext('2d');
    if (this.charts.bar) this.charts.bar.destroy();
    this.charts.bar = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: basicData.top_sectors.labels.map(l => l.replace('sector ', 'Sec ')),
        datasets: [{
          label: 'Avg Price (Cr)',
          data: basicData.top_sectors.values,
          backgroundColor: '#f59e0b',
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    // 2. Room Pie Chart (Overall)
    this.updatePieChart();
  },

  updatePieChart() {
    if (!this.extendedData) return;
    
    const sector = document.getElementById('pie-sector').value;
    const pieData = sector === 'Overall' ? this.extendedData.pie_overall : this.extendedData.pie_sectors[sector];
    
    const ctxPie = document.getElementById('chart-type-distribution').getContext('2d');
    if (this.charts.pie) this.charts.pie.destroy();
    this.charts.pie = new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: pieData.labels.map(l => `${l} BHK`),
        datasets: [{
          data: pieData.values,
          backgroundColor: ['#f59e0b', '#06b6d4', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  },

  renderPlotly(extData) {
    const layoutConfig = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#94a3b8', family: 'Inter, sans-serif' },
      margin: { t: 20, b: 40, l: 40, r: 20 }
    };

    // 1. Scatter Mapbox
    Plotly.newPlot('chart-mapbox', [{
      type: 'scattermapbox',
      lat: extData.mapbox.lat,
      lon: extData.mapbox.lon,
      mode: 'markers',
      marker: {
        size: extData.mapbox.built_up_area.map(a => a / 200),
        color: extData.mapbox.price,
        colorscale: 'Portland',
        colorbar: { title: 'Price (Cr)' }
      },
      text: extData.mapbox.text,
      hovertemplate: '<b>%{text}</b><br>Price: ₹%{marker.color:.2f} Cr<br>Area: %{marker.size} sqft<extra></extra>'
    }], {
      ...layoutConfig,
      mapbox: {
        style: "carto-darkmatter",
        center: { lat: 28.4595, lon: 77.0266 }, // Gurgaon coords
        zoom: 10.5
      }
    });

    // 2. Box plots
    const boxData = Object.keys(extData.boxplot).map(bhk => ({
      y: extData.boxplot[bhk],
      type: 'box',
      name: `${bhk} BHK`,
      marker: { color: '#06b6d4' }
    }));
    Plotly.newPlot('chart-boxplot', boxData, {
      ...layoutConfig,
      xaxis: { title: 'BHK', gridcolor: 'rgba(255,255,255,0.05)' },
      yaxis: { title: 'Price (Cr)', gridcolor: 'rgba(255,255,255,0.05)' },
      showlegend: false
    });

    // 3. Distplot (KDE approx using Violin as it's cleaner in Plotly without scipy)
    Plotly.newPlot('chart-distplot', [
      { type: 'violin', y: extData.distplot.house, name: 'House', side: 'negative', line: { color: '#f59e0b' } },
      { type: 'violin', y: extData.distplot.flat, name: 'Flat', side: 'positive', line: { color: '#06b6d4' } }
    ], {
      ...layoutConfig,
      yaxis: { title: 'Price (Cr)', gridcolor: 'rgba(255,255,255,0.05)' },
      violingap: 0,
      violinmode: 'overlay'
    });

    // 4. Init Scatter Plot
    this.updateScatterPlot();
  },

  updateScatterPlot() {
    if (!this.extendedData) return;
    
    const propType = document.getElementById('scatter-prop-type').value;
    const filtered = this.extendedData.scatter.filter(d => d.property_type === propType);
    
    const trace = {
      x: filtered.map(d => d.built_up_area),
      y: filtered.map(d => d.price),
      mode: 'markers',
      marker: {
        color: filtered.map(d => d.bedRoom),
        colorscale: 'Blues',
        showscale: true,
        colorbar: { title: 'bedRoom' },
        size: 8,
        opacity: 0.8,
        line: { width: 1, color: '#1e293b' }
      },
      text: filtered.map(d => `Area: ${d.built_up_area}<br>Price: ${d.price}<br>Beds: ${d.bedRoom}`),
      hovertemplate: '%{text}<extra></extra>'
    };

    Plotly.react('chart-scatter-area', [trace], {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#94a3b8', family: 'Inter, sans-serif' },
      margin: { t: 20, b: 40, l: 40, r: 20 },
      xaxis: { title: 'Built-up Area (Sq.Ft.)', gridcolor: 'rgba(255,255,255,0.05)' },
      yaxis: { title: 'Price (Cr)', gridcolor: 'rgba(255,255,255,0.05)' }
    });
  },

  async fetchWordCloud() {
    const sector = document.getElementById('wordcloud-sector').value;
    const loader = document.getElementById('wordcloud-loading');
    const img = document.getElementById('wordcloud-img');
    
    if (!sector) return;
    
    loader.style.display = 'block';
    img.style.display = 'none';
    
    try {
      const res = await fetch(`/api/wordcloud?sector=${encodeURIComponent(sector)}`);
      const data = await res.json();
      
      if (data.success) {
        img.src = data.image;
        loader.style.display = 'none';
        img.style.display = 'inline-block';
      } else {
        loader.textContent = 'Failed to generate word cloud.';
      }
    } catch (e) {
      console.error(e);
      loader.textContent = 'Error fetching word cloud.';
    }
  }
};
