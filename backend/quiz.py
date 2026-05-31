from flask import request, session, jsonify
from flask_login import login_required, current_user
from datetime import datetime
import random
from models import db, Deck, Card, QuizResult

def register_quiz_routes(app):
    
    @app.route('/quiz_select_data', methods=['GET'])
    @login_required
    def quiz_select_data():
        try:
            quizzes = QuizResult.query.filter_by(user_id=current_user.id).all()
            quizzes_taken = len(quizzes)
            avg_score = round(sum(q.percentage for q in quizzes) / quizzes_taken, 1) if quizzes_taken > 0 else 0
            best_score = max([q.percentage for q in quizzes]) if quizzes_taken > 0 else 0
            
            decks = Deck.query.filter_by(user_id=current_user.id).order_by(Deck.id).all()
            user_decks = [
                {"id": deck.id, "name": deck.name, "subject": getattr(deck, 'subject', 'General')} 
                for deck in decks
            ]
            
            return jsonify({
                "quizzes_taken": quizzes_taken,
                "avg_score": avg_score,
                "best_score": best_score,
                "user_decks": user_decks
            }), 200
        except Exception as e:
            return jsonify({"error": "Failed to load quiz data"}), 500

    @app.route('/quiz/start/deck/<int:deck_id>', methods=['GET'])
    @login_required
    def quiz_start_deck(deck_id):
        # Clear old session data
        for key in ['quiz_cards', 'quiz_idx', 'quiz_answers', 'quiz_start', 'quiz_deck_name', 'quiz_deck_id', 'quiz_limit']:
            session.pop(key, None)

        deck = db.session.get(Deck, deck_id)
        if not deck or deck.user_id != current_user.id:
            return jsonify({"error": "Deck not found"}), 403
            
        cards = Card.query.filter_by(deck_id=deck.id).all()
        if len(cards) == 0:
            return jsonify({"error": "No cards in deck"}), 400
            
        # Standard deck practice: cap at 25 cards
        num_questions = min(len(cards), 25)
        selected = random.sample(cards, num_questions)
        
        quiz_cards = []
        for card in selected:
            other_cards = [c for c in cards if c.id != card.id]
            
            # Safely grab wrong options even if the deck has very few cards
            wrong_options = []
            if len(other_cards) >= 3:
                wrong_options = random.sample(other_cards, 3)
            elif len(other_cards) > 0:
                wrong_options = random.choices(other_cards, k=3)
                
            options = [c.answer for c in wrong_options] + [card.answer]
            
            # Ensure 4 unique options
            options = list(set(options))
            while len(options) < 4:
                options.append(f"Generic Option {len(options)}")
                
            random.shuffle(options)
            quiz_cards.append({'id': card.id, 'options': options})
        
        session['quiz_cards'] = quiz_cards
        session['quiz_idx'] = 0
        session['quiz_answers'] = [] 
        session['quiz_start'] = datetime.now().isoformat()
        
        # 🌟 DYNAMIC TIMER: Exactly 30 seconds per question
        session['quiz_limit'] = num_questions * 30
        session['quiz_deck_name'] = deck.name
        session['quiz_deck_id'] = deck.id
        
        return jsonify({"status": "success"}), 200

    @app.route('/quiz/start/all/<int:num>', methods=['GET'])
    @login_required
    def quiz_start_all(num):
        # Clear old session data
        for key in ['quiz_cards', 'quiz_idx', 'quiz_answers', 'quiz_start', 'quiz_deck_name', 'quiz_deck_id', 'quiz_limit']:
            session.pop(key, None)

        cards = Card.query.join(Deck).filter(Deck.user_id == current_user.id).all()
        if len(cards) == 0:
            return jsonify({"error": "Not enough cards! Please create a deck first."}), 400
            
        # 🌟 THE FIX: If you want 50 questions but only have 25 cards, 
        # random.choices() will repeat cards to ensure you get exactly 50!
        if len(cards) >= num:
            selected = random.sample(cards, num)
        else:
            selected = random.choices(cards, k=num)
        
        quiz_cards = []
        for card in selected:
            other_cards = [c for c in cards if c.id != card.id]
            
            wrong_options = []
            if len(other_cards) >= 3:
                wrong_options = random.sample(other_cards, 3)
            elif len(other_cards) > 0:
                wrong_options = random.choices(other_cards, k=3)
                
            options = [c.answer for c in wrong_options] + [card.answer]
            
            options = list(set(options))
            while len(options) < 4:
                options.append(f"Generic Option {len(options)}")
                
            random.shuffle(options)
            quiz_cards.append({'id': card.id, 'options': options})
        
        session['quiz_cards'] = quiz_cards
        session['quiz_idx'] = 0
        session['quiz_answers'] = []
        session['quiz_start'] = datetime.now().isoformat()
        
        # 🌟 DYNAMIC TIMER: Exactly 30 seconds per question (50qs = 25 minutes)
        session['quiz_limit'] = num * 30 
        session['quiz_deck_name'] = f"{num} Question Challenge"
        
        first_deck = Deck.query.filter_by(user_id=current_user.id).first()
        session['quiz_deck_id'] = first_deck.id if first_deck else 1
            
        return jsonify({"status": "success"}), 200

    # (I removed the duplicate quiz_start_all route that was right here!)

    @app.route('/quiz/take_data', methods=['GET'])
    @login_required
    def quiz_take_data():
        cards = session.get('quiz_cards', [])
        idx = session.get('quiz_idx', 0)
        
        if not cards or idx >= len(cards):
            return jsonify({"status": "completed"}), 200
            
        start = datetime.fromisoformat(session.get('quiz_start', datetime.now().isoformat()))
        elapsed = int((datetime.now() - start).total_seconds())
        left = max(0, session.get('quiz_limit', 600) - elapsed)
        
        if left <= 0:
            return jsonify({"status": "completed"}), 200
            
        # Reconstruct rich data dynamically to save cookie space
        card_meta = cards[idx]
        card = db.session.get(Card, card_meta['id'])
        
        return jsonify({
            "status": "active",
            "card": {"id": card.id, "question": card.question},
            "options": card_meta['options'],
            "current": idx + 1,
            "total": len(cards),
            "time_left": left,
            "deck_name": session.get('quiz_deck_name', 'General Quiz')
        }), 200

    @app.route('/quiz/answer', methods=['POST'])
    @login_required
    def quiz_answer():
        user_ans = request.form.get('answer', '').strip()
        cards = session.get('quiz_cards', [])
        idx = session.get('quiz_idx', 0)
        answers = session.get('quiz_answers', [])
        
        if idx < len(cards):
            card = db.session.get(Card, cards[idx]['id'])
            correct = user_ans.lower() == card.answer.lower()
            
            # Store minimal data
            answers.append({'id': card.id, 'user': user_ans, 'correct': correct})
            session['quiz_answers'] = answers
            session['quiz_idx'] = idx + 1
            
        return jsonify({"status": "success"}), 200

    @app.route('/quiz/results_data', methods=['GET'])
    @login_required
    def quiz_results_data():
        answers = session.get('quiz_answers', [])
        total = len(answers)
        
        if total == 0:
            return jsonify({"error": "No quiz data found"}), 400
            
        correct = sum(1 for a in answers if a['correct'])
        percent = (correct / total * 100)
        
        start_str = session.get('quiz_start')
        taken = int((datetime.now() - datetime.fromisoformat(start_str)).total_seconds()) if start_str else 0
        minutes, seconds = taken // 60, taken % 60
        
        # Reconstruct detailed answers for UI
        answers_rich, fsrs_q, sm2_q = [], [], []
        for a in answers:
            card = db.session.get(Card, a['id'])
            if not card: continue
            algo = getattr(card, 'algorithm', 'Unknown')
            rich_ans = {
                'question': card.question,
                'user': a['user'],
                'correct_answer': card.answer,
                'correct': a['correct'],
                'algorithm': algo
            }
            answers_rich.append(rich_ans)
            if algo == 'FSRS': fsrs_q.append(rich_ans)
            if algo in ['SM2', 'SM-2']: sm2_q.append(rich_ans)
            
        fsrs_correct = sum(1 for a in fsrs_q if a['correct'])
        sm2_correct = sum(1 for a in sm2_q if a['correct'])
        
        if percent >= 90: msg, emoji, color = "EXCELLENT!", "🏆", "#10b981" # emerald
        elif percent >= 70: msg, emoji, color = "GOOD JOB!", "🎯", "#3b82f6" # blue
        elif percent >= 50: msg, emoji, color = "KEEP GOING!", "📚", "#f59e0b" # amber
        else: msg, emoji, color = "NEXT TIME!", "🌱", "#ef4444" # red
        
        # Save & Award Points
        db.session.add(QuizResult(
            user_id=current_user.id, deck_id=session.get('quiz_deck_id', 1),
            score=correct, total_questions=total, percentage=percent, time_taken=taken, created_at=datetime.now()
        ))
        points_earned = correct * 10
        current_user.total_points = (current_user.total_points or 0) + points_earned
        db.session.commit()
        
        # Clear Session
        for key in ['quiz_cards', 'quiz_idx', 'quiz_answers', 'quiz_start', 'quiz_deck_name', 'quiz_deck_id', 'quiz_limit']:
            session.pop(key, None)
        
        return jsonify({
            "score": correct, "total": total, "percentage": round(percent, 1),
            "time_min": minutes, "time_sec": seconds,
            "message": msg, "emoji": emoji, "color": color,
            "answers": answers_rich, "points_earned": points_earned,
            "fsrs_percent": round((fsrs_correct/len(fsrs_q)*100),1) if fsrs_q else 0,
            "sm2_percent": round((sm2_correct/len(sm2_q)*100),1) if sm2_q else 0
        }), 200