# app.py
from flask import Flask, Response, redirect, url_for, flash, render_template, request, jsonify, send_file
from flask_login import LoginManager, login_required, current_user
from models import db, User, Deck, Card, QuizResult, LearningProgress, CardReview
from config import Config
import csv
from io import StringIO, BytesIO
from datetime import datetime, date, timedelta
import pandas as pd
import zipfile
import os
from flask import Flask
from flask_cors import CORS
from flask import jsonify
from datetime import datetime, timedelta
from sqlalchemy import func

from quiz import register_quiz_routes
from admin_routes import register_admin_routes
app = Flask(__name__)
CORS(app) # This allows React to talk to Flask
from dotenv import load_dotenv
load_dotenv()

# Groq for Chatbot
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("⚠️ Groq not installed. Run: pip install groq")

# Initialize Flask app
app = Flask(__name__, template_folder='../frontend/templates', static_folder='static')
app.config.from_object(Config)

# Initialize database
db.init_app(app)

# Initialize login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    
    return db.session.get(User, int(user_id))

# Initialize Groq client
groq_client = None
if GROQ_AVAILABLE:
    try:
        GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq AI Chatbot initialized (Llama 3.3 70B)")
    except Exception as e:
        print(f"⚠️ Groq initialization failed: {e}")
        groq_client = None

# Chatbot system prompt
CHATBOT_SYSTEM_PROMPT = """You are an expert Python programming assistant for the Auxilium College Smart Study Buddy app.

Your job is to:
- Answer ANY question about Python clearly and accurately
- Generate clean, well-commented Python code on request
- Explain concepts with simple examples (beginner-friendly)
- Debug code if the user pastes it
- Suggest best practices and improvements
- Cover topics like: basics, OOP, data structures, algorithms, libraries (NumPy, Pandas, Flask, etc.), file I/O, APIs, decorators, generators, async, etc.

Response style:
- Always use proper Python code blocks with markdown formatting
- Keep explanations concise but complete
- If generating code, add a brief explanation of how it works
- If the user's question is unclear, ask for clarification
- Be friendly and encouraging to students learning Python

Keep responses under 2000 tokens for faster delivery."""

# Create database tables and demo user
with app.app_context():
    db.create_all()
    print("✅ Database tables created")
    
    # Create demo user if not exists
    if not User.query.filter_by(username='student').first():
        from werkzeug.security import generate_password_hash
        demo = User(
            username='student', 
            email='student@example.com', 
            password=generate_password_hash('study123'),
            total_points=0,
            total_studied=0,
            streak=0,
            unlocked_decks=999,
            stars=0
        )
        db.session.add(demo)
        db.session.commit()
        print("✅ Demo user created: student / study123")
        
        # Create demo deck with 10 cards
        demo_deck = Deck(name="🐍 Python Demo (10 Cards)", user_id=demo.id)
        db.session.add(demo_deck)
        db.session.commit()
        
        demo_cards = [
            ("What is Python?", "A high-level, interpreted programming language"),
            ("How do you print in Python?", "print('Hello World')"),
            ("What is a variable?", "Container for storing data values"),
            ("What is a list?", "Ordered, mutable collection"),
            ("What is a function?", "Reusable block of code"),
            ("What is a dictionary?", "Key-value pair collection"),
            ("What is a loop?", "Repeats a block of code"),
            ("What is an if statement?", "Conditional execution"),
            ("What is a class?", "Blueprint for objects"),
            ("What is inheritance?", "Child class inherits from parent"),
        ]
        
        for i, (q, a) in enumerate(demo_cards):
            algo = 'SM2' if i < 5 else 'FSRS'
            card = Card(
                question=q, 
                answer=a, 
                deck_id=demo_deck.id, 
                algorithm=algo,
                stability=2.0,
                difficulty=5.0,
                e_factor=2.5,
                interval=1,
                review_count=0,
                avg_time=0.0,
                is_mastered=False
            )
            db.session.add(card)
        db.session.commit()
        print("✅ Demo deck created with 10 cards (5 SM2, 5 FSRS)")

# ============================================================
# IMPORT ALL ROUTE MODULES
# ============================================================
from auth import register_auth_routes
from decks import register_decks_routes
from study import register_study_routes
from quiz import register_quiz_routes
from research import register_research_routes
from learning import register_learning_routes
from flask import Flask
from flask_mail import Mail
from dotenv import load_dotenv



# Initialize Mail

app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT'))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

mail = Mail(app)

# ============================================================
# REGISTER ALL ROUTES
# ============================================================
register_auth_routes(app,mail)
register_decks_routes(app)
register_study_routes(app)
register_quiz_routes(app)
register_research_routes(app)
register_learning_routes(app)
register_admin_routes(app)





# ============================================================
# HOME ROUTE
# ============================================================
@app.route('/')
def home():
    return redirect(url_for('login'))

# ============================================================
# DASHBOARD ROUTE (For Students Only)
# ============================================================
@app.route('/dashboard', methods=['GET'])
@login_required
def dashboard():
    # 1. Fetch decks and calculate totals using your exact existing logic
    decks = Deck.query.filter_by(user_id=current_user.id).all()
    total_cards = sum(len(deck.cards) for deck in decks)
    
    total_mastered = Card.query.join(Deck).filter(
        Deck.user_id == current_user.id, 
        Card.is_mastered == True
    ).count()
    
    # 2. Update stars logic (identical to your original code)
    if current_user.total_points:
        new_stars = current_user.total_points // 100
        if new_stars != current_user.stars:
            current_user.stars = new_stars
            db.session.commit()
            
    # 3. Return the data as JSON for React instead of an HTML template
    return jsonify({
        "user": {
            "username": current_user.username,
            "stars": current_user.stars or 0,
            "total_points": current_user.total_points or 0,
            "streak": getattr(current_user, 'streak', 0) # Safe fallback if streak isn't in DB
        },
        "total_mastered": total_mastered,
        "total_cards": total_cards,
        "decks": [
            {
                "id": deck.id, 
                "name": deck.name, 
                "subject": getattr(deck, 'subject', 'General'),
                "count": len(deck.cards) # React needs to know how many cards are in the deck
            } 
            for deck in decks
        ]
    }), 200

# ============================================================
# PROGRESS TRACKING ROUTE
# ============================================================
@app.route('/progress_data', methods=['GET'])
@login_required
def api_progress_data():
    if current_user.username in ['Buela', 'admin', 'Kishore'] or getattr(current_user, 'is_admin', False):
        return jsonify({'redirect': '/admin_dashboard'}), 200
    
    today = date.today()
    
    # 1. Weekly Progress Data (Last 4 weeks)
    weekly_data = []
    for i in range(3, -1, -1):
        week_start = today - timedelta(days=i*7 + 7)
        week_end = today - timedelta(days=i*7)
        
        mastered = Card.query.join(Deck).filter(
            Deck.user_id == current_user.id,
            Card.is_mastered == True,
            Card.last_review >= week_start,
            Card.last_review <= week_end
        ).count()
        
        weekly_data.append({"name": f"Week {4-i}", "mastered": mastered})
    
    # 2. Mastery Counts
    fsrs_mastered = Card.query.join(Deck).filter(Deck.user_id == current_user.id, Card.algorithm == 'FSRS', Card.is_mastered == True).count()
    sm2_mastered = Card.query.join(Deck).filter(Deck.user_id == current_user.id, Card.algorithm.in_(['SM2', 'SM-2']), Card.is_mastered == True).count()
    
    # 3. Daily Activity (Last 7 days)
    daily_data = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        
        cards_studied = CardReview.query.join(Card).join(Deck).filter(
            Deck.user_id == current_user.id,
            CardReview.created_at >= datetime.combine(day, datetime.min.time()),
            CardReview.created_at <= datetime.combine(day, datetime.max.time())
        ).count()
        
        daily_data.append({"name": day.strftime('%a'), "studied": cards_studied})
    
    # 4. Retention Rate Trend
    retention_data = []
    for i in range(3, -1, -1):
        week_start = today - timedelta(days=i*7 + 7)
        week_end = today - timedelta(days=i*7)
        
        fsrs_revs = CardReview.query.join(Card).join(Deck).filter(
            Deck.user_id == current_user.id, Card.algorithm == 'FSRS',
            CardReview.created_at >= week_start, CardReview.created_at <= week_end
        ).all()
        fsrs_ret = round((sum(1 for r in fsrs_revs if r.rating >= 3) / len(fsrs_revs)) * 100, 1) if fsrs_revs else 0
        
        sm2_revs = CardReview.query.join(Card).join(Deck).filter(
            Deck.user_id == current_user.id, Card.algorithm.in_(['SM2', 'SM-2']),
            CardReview.created_at >= week_start, CardReview.created_at <= week_end
        ).all()
        sm2_ret = round((sum(1 for r in sm2_revs if r.rating >= 3) / len(sm2_revs)) * 100, 1) if sm2_revs else 0
        
        retention_data.append({"name": f"Week {4-i}", "FSRS": fsrs_ret, "SM2": sm2_ret})
    
    # 5. Totals
    week_ago = today - timedelta(days=7)
    total_studied_week = CardReview.query.join(Card).join(Deck).filter(
        Deck.user_id == current_user.id, CardReview.created_at >= week_ago
    ).count()
    
    all_reviews = CardReview.query.join(Card).join(Deck).filter(Deck.user_id == current_user.id).all()
    avg_retention = round((sum(1 for r in all_reviews if r.rating >= 3) / len(all_reviews)) * 100, 1) if all_reviews else 0
    
    return jsonify({
        "weekly_data": weekly_data,
        "daily_data": daily_data,
        "retention_data": retention_data,
        "fsrs_mastered": fsrs_mastered,
        "sm2_mastered": sm2_mastered,
        "total_studied_week": total_studied_week,
        "avg_retention": avg_retention
    }), 200

# Visual the progress data as JSON for React to consume in the Progress.jsx page

@app.route('/progress_data', methods=['GET'])
@login_required
def progress_data():
    try:
        # 1. Summary Statistics
        fsrs_mastered = Card.query.join(Deck).filter(
            Deck.user_id == current_user.id,
            Card.is_mastered == True,
            Card.algorithm == 'FSRS' 
        ).count()

        # Notice we check for 'SM2' based on your model's default value
        sm2_mastered = Card.query.join(Deck).filter(
            Deck.user_id == current_user.id,
            Card.is_mastered == True,
            Card.algorithm.in_(['SM2', 'SM-2']) 
        ).count()
        
        # Calculate cards studied in the last 7 days using the correct column name
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        total_studied_week = Card.query.join(Deck).filter(
            Deck.user_id == current_user.id,
            Card.last_review >= seven_days_ago # Fixed: last_review
        ).count()

        # Calculate accurate retention using your CardReview table! (Rating 3 or 4 = Correct)
        total_reviews = CardReview.query.filter_by(user_id=current_user.id).count()
        if total_reviews > 0:
            correct_reviews = CardReview.query.filter(
                CardReview.user_id == current_user.id,
                CardReview.rating >= 3
            ).count()
            avg_retention = round((correct_reviews / total_reviews) * 100)
        else:
            avg_retention = 0

        # 2. Time-Series Data for Charts (Last 7 Days)
        daily_labels = []
        daily_data = []
        
        for i in range(6, -1, -1):
            target_date = datetime.utcnow() - timedelta(days=i)
            daily_labels.append(target_date.strftime('%a')) 
            
            day_start = target_date.replace(hour=0, minute=0, second=0)
            day_end = target_date.replace(hour=23, minute=59, second=59)
            
            # Count how many reviews happened on this specific day
            cards_that_day = CardReview.query.filter(
                CardReview.user_id == current_user.id,
                CardReview.created_at >= day_start,
                CardReview.created_at <= day_end
            ).count()
            
            daily_data.append(cards_that_day)

        # 3. Return structured JSON
        return jsonify({
            "fsrs_mastered": fsrs_mastered,
            "sm2_mastered": sm2_mastered,
            "total_studied_week": total_studied_week,
            "avg_retention": avg_retention,
            
            "daily_labels": daily_labels,
            "daily_data": daily_data,
            
            # Placeholders for Weekly trends (Can be updated later with complex SQL GroupBys)
            "weekly_labels": ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            "weekly_data": [0, 0, 0, fsrs_mastered + sm2_mastered], 
            
            "retention_labels": ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            "fsrs_retention_data": [0, 0, 0, avg_retention],
            "sm2_retention_data": [0, 0, 0, max(0, avg_retention - 5)] 
        }), 200

    except Exception as e:
        print(f"Error generating progress data: {e}")
        return jsonify({"error": "Failed to generate analytics"}), 500
     
     
#Admin Routes
     
# ============================================================
# EXPORT ROUTES
# ============================================================

@app.route('/export')
@login_required
def export():
    """Export cards to CSV"""
    cards = Card.query.join(Deck).filter(Deck.user_id == current_user.id).all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['Question', 'Answer', 'Algorithm', 'Reviews', 'Avg Time (s)', 'Mastered'])
    for card in cards:
        writer.writerow([
            card.question, 
            card.answer, 
            card.algorithm, 
            card.review_count, 
            round(card.avg_time, 2), 
            'Yes' if card.is_mastered else 'No'
        ])
    response = Response(output.getvalue(), mimetype='text/csv')
    response.headers.set('Content-Disposition', 'attachment', filename=f'cards_{current_user.username}_{datetime.now().strftime("%Y%m%d")}.csv')
    return response

@app.route('/export/excel')
@login_required
def export_excel():
    """Export all user data to Excel file"""
    user = current_user
    decks = Deck.query.filter_by(user_id=user.id).all()
    
    cards_data = []
    reviews_data = []
    quiz_data = []
    
    for deck in decks:
        for card in deck.cards:
            cards_data.append({
                'Deck': deck.name,
                'Question': card.question,
                'Answer': card.answer,
                'Algorithm': card.algorithm,
                'Review Count': card.review_count,
                'Average Time (s)': card.avg_time,
                'Mastered': 'Yes' if card.is_mastered else 'No'
            })
            
            for review in card.reviews:
                reviews_data.append({
                    'Deck': deck.name,
                    'Question': card.question,
                    'Algorithm': card.algorithm,
                    'Rating': review.rating,
                    'Correct': 'Yes' if review.is_correct else 'No',
                    'Response Time (s)': review.response_time,
                    'Date': review.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })
    
    quizzes = QuizResult.query.filter_by(user_id=user.id).all()
    for quiz in quizzes:
        deck = Deck.query.get(quiz.deck_id)
        quiz_data.append({
            'Deck': deck.name if deck else 'General Quiz',
            'Score': quiz.score,
            'Total Questions': quiz.total_questions,
            'Percentage': f"{quiz.percentage}%",
            'Time Taken (s)': quiz.time_taken,
            'Date': quiz.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    output = BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        user_stats = pd.DataFrame([{
            'Username': user.username,
            'Total Points': user.total_points,
            'Stars': user.stars,
            'Streak': user.streak,
            'Cards Studied': user.total_studied,
            'Decks Available': len(decks)
        }])
        user_stats.to_excel(writer, sheet_name='User Stats', index=False)
        
        if cards_data:
            pd.DataFrame(cards_data).to_excel(writer, sheet_name='Cards', index=False)
        if reviews_data:
            pd.DataFrame(reviews_data).to_excel(writer, sheet_name='Reviews', index=False)
        if quiz_data:
            pd.DataFrame(quiz_data).to_excel(writer, sheet_name='Quiz Results', index=False)
    
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'study_data_{user.username}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
    )

# ============================================================
# CHATBOT ROUTE — Groq AI Python Tutor
# ============================================================

@app.route('/chat', methods=['POST'])
@login_required
def chat():
    """Chatbot endpoint using Groq's Llama 3.3 70B"""
    
    if not GROQ_AVAILABLE or groq_client is None:
        return jsonify({'error': 'Chatbot service not available. Please install groq: pip install groq'}), 503
    
    data = request.get_json()
    user_message = data.get('message', '').strip()
    history = data.get('history', [])

    if not user_message:
        return jsonify({'error': 'Empty message'}), 400

    try:
        messages = [{"role": "system", "content": CHATBOT_SYSTEM_PROMPT}]
        
        for msg in history[-10:]:
            role = "user" if msg.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})
        
        messages.append({"role": "user", "content": user_message})
        
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=2048,
            top_p=0.95,
        )
        
        reply = response.choices[0].message.content
        
        current_user.total_points = (current_user.total_points or 0) + 1
        db.session.commit()
        
        return jsonify({'reply': reply})

    except Exception as e:
        error_msg = str(e)
        if "API_KEY" in error_msg or "invalid" in error_msg.lower():
            return jsonify({'error': 'Invalid API key. Please check your Groq API key.'}), 500
        elif "rate limit" in error_msg.lower() or "429" in error_msg:
            return jsonify({'error': 'Rate limit reached. Please wait a moment.'}), 429
        else:
            return jsonify({'error': f'Chatbot error: {error_msg}'}), 500


# ============================================================
# MAIN ENTRY POINT
# ============================================================
if __name__ == '__main__':
    print('\n' + '='*60)
    print('🐍 PYTHON FULL COURSE - SMART STUDY BUDDY')
    print('='*60)
    print('\n📋 FEATURES:')
    print('   ✅ FSRS vs SM-2 Algorithm Comparison')
    print('   ✅ Learning Material with Progress Tracking')
    print('   ✅ Study Mode with Timer')
    print('   ✅ Multiple Choice Quiz')
    print('   ✅ Research Dashboard')
    print('   ✅ Stars & Points System')
    print('   ✅ Export Data to Excel/CSV')
    print('   ✅ Admin Research Dashboard with Activity Tracking')
    print('   ✅ Progress Tracking Page with Charts')
    if GROQ_AVAILABLE and groq_client:
        print('   ✅ Groq AI Chatbot (Llama 3.3 70B) - FAST & FREE!')
    else:
        print('   ⚠️ Chatbot unavailable (groq not installed)')
    print('='*60)
    print('\n👉 http://127.0.0.1:5000')
    print('📚 Demo Login: student')
    print('🔑 Password: study123')
    print('👑 Admin Login: Buela')
    print('🔑 Admin Password: 9840038816')
    print('='*60 + '\n')
    app.run(debug=True, host='127.0.0.1', port=5000)