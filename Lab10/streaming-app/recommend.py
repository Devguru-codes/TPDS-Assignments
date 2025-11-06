from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = Flask(__name__)

@app.route('/recommend', methods=['POST'])
def recommend_content():
    data = request.get_json()
    user_preferences = data['user_preferences']
    content = data['content']  # List of {id, genre}

    documents = [user_preferences] + [c['genre'] for c in content]
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(documents)

    user_vector = tfidf_matrix[0:1]
    content_vectors = tfidf_matrix[1:]
    similarities = cosine_similarity(user_vector, content_vectors).flatten()

    content_ids = [c['id'] for c in content]
    recommendations = sorted(zip(content_ids, similarities), key=lambda x: x[1], reverse=True)[:3]
    return jsonify([content_id for content_id, _ in recommendations])

if __name__ == '__main__':
    app.run(port=5005)