# 🎬 Capstone Project – Movie Recommendation System

A full-stack **Movie Recommendation System** that recommends movies based on content similarity. Users can search for their favorite movies and instantly receive personalized recommendations along with movie posters.

🌐 **Live Demo:** https://capstone-project-xjwm.onrender.com

---

## 📌 Features

* 🔍 Search for any movie from the dataset
* 🎯 Content-based movie recommendation
* 🖼️ Displays movie posters for recommended movies
* ⚡ Fast recommendation generation using cosine similarity
* 🌐 Fully deployed web application
* 📱 Clean and responsive user interface

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* FastAPI
* Python

### Machine Learning

* Pandas
* NumPy
* Scikit-learn
* Cosine Similarity
* Pickle

### Deployment

* **Frontend:** Vercel
* **Backend:** Render

---

## 📂 Project Structure

```
Capstone_Project/
│
├── backend/
│   ├── main.py
│   ├── recommendation_model.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── ...
│
├── datasets/
│   └── Movie datasets
│
├── models/
│   ├── similarity.pkl
│   └── movies.pkl
│
├── notebooks/
│   └── Data preprocessing & model development
│
└── README.md
```

> Folder names may vary slightly depending on your repository structure.

---

## 🚀 How It Works

1. Movie data is cleaned and preprocessed.
2. Important movie features are combined into a single text representation.
3. Text is vectorized using machine learning techniques.
4. Cosine Similarity is computed between movies.
5. When a user searches for a movie, the system finds the most similar movies.
6. Movie posters are fetched and displayed along with recommendations.

---

## ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/AnImEsh015/Capstone_Project.git
```

```bash
cd Capstone_Project
```

### Install backend dependencies

```bash
pip install -r requirements.txt
```

### Run the FastAPI server

```bash
uvicorn main:app --reload
```

### Run the frontend

Open `index.html` in your browser or run it using a local server.

---

## 📸 Demo

Visit the live application:

**https://capstone-project-xjwm.onrender.com**

---

## 📈 Future Improvements

* User authentication
* Collaborative filtering recommendations
* Hybrid recommendation system
* Watchlist feature
* Movie ratings and reviews
* Genre-based filtering
* Trending and popular movie section
* Better UI/UX with animations

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new feature branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

## 👨‍💻 Author

**Animesh Kumar**

GitHub: https://github.com/AnImEsh015

---

## ⭐ If you found this project useful, consider giving it a star!
