from flask import Flask, request, jsonify
from textblob import TextBlob

app = Flask(__name__)

@app.route('/sentiment', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    content = data['content']
    analysis = TextBlob(content)
    sentiment = 'positive' if analysis.sentiment.polarity > 0 else 'negative' if analysis.sentiment.polarity < 0 else 'neutral'
    return jsonify({'sentiment': sentiment})

if __name__ == '__main__':
    app.run(port=5006)
