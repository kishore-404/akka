from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

# Get API key from environment variables (set in Vercel dashboard)
GROK_API_KEY = os.environ.get('GROK_API_KEY', '')

@app.route('/api/chat', methods=['POST'])
def chat():
    """AI Chatbot endpoint for Grok API"""
    data = request.get_json()
    user_message = data.get('message', '').strip()
    
    if not user_message:
        return jsonify({'error': 'Empty message'}), 400
    
    try:
        response = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROK_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "grok-beta",
                "messages": [{"role": "user", "content": user_message}]
            },
            timeout=30
        )
        result = response.json()
        reply = result['choices'][0]['message']['content']
        return jsonify({'reply': reply})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

# Vercel requires this
app = app

if __name__ == '__main__':
    app.run(port=5000)
