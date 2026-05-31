# chat.py
from flask import request, jsonify
from flask_login import login_required, current_user
import os
import json
import urllib.request

# Initialize your Groq API key (Ensure this is in your .env file)
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

def register_chat_routes(app):
    
    @app.route('/api/chat', methods=['POST'])
    @login_required
    def api_chat():
        if not GROQ_API_KEY:
            return jsonify({"error": "AI Tutor is currently offline (Missing API Key)"}), 500
            
        data = request.get_json()
        user_message = data.get('message')
        history = data.get('history', [])
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # Construct the conversation payload
        messages = [
            {
                "role": "system", 
                "content": f"You are 'Buddy', an elite, professional, and highly encouraging AI tutor for {current_user.username}. You provide concise, accurate, and easy-to-understand explanations. Keep responses brief as they may be read aloud via Text-to-Speech."
            }
        ]
        
        # Append history
        for msg in history:
            messages.append({"role": msg.get('role', 'user'), "content": msg.get('content', '')})
            
        # Append the new message
        messages.append({"role": "user", "content": user_message})

        try:
            # Direct HTTP call to Groq API
            req = urllib.request.Request(
                'https://api.groq.com/openai/v1/chat/completions',
                data=json.dumps({
                    "model": "llama3-70b-8192",
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 500
                }).encode('utf-8'),
                headers={
                    'Authorization': f'Bearer {GROQ_API_KEY}',
                    'Content-Type': 'application/json'
                }
            )
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                ai_reply = result['choices'][0]['message']['content']
                
                return jsonify({
                    "status": "success",
                    "reply": ai_reply
                }), 200
                
        except Exception as e:
            print(f"Chat API Error: {e}")
            return jsonify({"error": "Failed to connect to the AI brain."}), 500