# study.py - RESEARCH VERSION API
from flask import jsonify, session, request
from flask_login import login_required, current_user
from datetime import datetime, date, timedelta
from models import db, Deck, Card, CardReview
from fsrs import FSRS, SM2

def register_study_routes(app):
    
    @app.route('/study_select_data/<int:deck_id>', methods=['GET'])
    @login_required
    def study_select_data(deck_id):
        deck = db.session.get(Deck, deck_id)
        if not deck or deck.user_id != current_user.id:
            return jsonify({"error": "Deck not found"}), 404
        
        cards = Card.query.filter_by(deck_id=deck.id).all()
        fsrs = sum(1 for c in cards if c.algorithm == 'FSRS')
        sm2 = sum(1 for c in cards if c.algorithm in ['SM2', 'SM-2'])
        
        return jsonify({
            "deck": {"id": deck.id, "name": deck.name},
            "total_cards": len(cards),
            "fsrs_count": fsrs,
            "sm2_count": sm2
        }), 200

    @app.route('/study/start/<int:deck_id>/<algo>', methods=['POST'])
    @login_required
    def study_start(deck_id, algo):
        deck = db.session.get(Deck, deck_id)
        if not deck or deck.user_id != current_user.id:
            return jsonify({"error": "Unauthorized"}), 403
            
        cards = Card.query.filter_by(deck_id=deck.id).all()
        if algo != 'all':
            cards = [c for c in cards if c.algorithm == algo]
            
        if not cards:
            return jsonify({"error": "No cards found for this selection"}), 400
            
        session['study_cards'] = [c.id for c in cards]
        session['study_idx'] = 0
        session['study_correct'] = 0
        session['study_points_earned'] = 0
        session['study_start_time'] = datetime.now().isoformat()
        
        return jsonify({"status": "success"}), 200

    @app.route('/study/current_card', methods=['GET'])
    @login_required
    def study_current_card():
        cards = session.get('study_cards', [])
        idx = session.get('study_idx', 0)
        total = len(cards)
        
        if idx >= total:
            # Quiz complete! Send final stats and clear session
            correct = session.get('study_correct', 0)
            points_earned = session.get('study_points_earned', 0)
            
            session.pop('study_cards', None)
            session.pop('study_idx', None)
            session.pop('study_correct', None)
            session.pop('study_points_earned', None)
            session.pop('study_start_time', None)
            
            return jsonify({
                "status": "completed",
                "total": total,
                "correct": correct,
                "accuracy": round((correct/total*100), 1) if total > 0 else 0,
                "points_earned": points_earned
            }), 200
        
        card = db.session.get(Card, cards[idx])
        return jsonify({
            "status": "active",
            "idx": idx + 1,
            "total": total,
            "card": {
                "id": card.id,
                "question": card.question,
                "answer": card.answer,
                "algorithm": card.algorithm
            }
        }), 200

    @app.route('/study/rate/<int:card_id>/<int:rating>/<float:rt>', methods=['POST'])
    @login_required
    def rate(card_id, rating, rt):
        card = db.session.get(Card, card_id)
        if not card or card.deck.user_id != current_user.id:
            return jsonify({"error": "Card not found or unauthorized"}), 403
            
        card_data = {
            'stability': getattr(card, 'stability', 2.0),
            'difficulty': getattr(card, 'difficulty', 5.0),
            'e_factor': getattr(card, 'e_factor', 2.5),
            'interval': getattr(card, 'interval', 1),
            'last_review': card.last_review,
            'review_count': card.review_count or 0
        }
        
        # Apply the appropriate algorithm
        if card.algorithm == 'FSRS':
            scheduler = FSRS()
            updated_card, next_review = scheduler.review_card(card_data, rating, datetime.now())
            card.stability = updated_card['stability']
            card.difficulty = updated_card['difficulty']
            card.last_review = updated_card['last_review']
            card.next_review = updated_card['next_review']
            card.review_count = updated_card['review_count']
        else:  # SM2
            scheduler = SM2()
            updated_card, next_review = scheduler.review_card(card_data, rating, datetime.now())
            card.e_factor = updated_card['e_factor']
            card.interval = updated_card['interval']
            card.last_review = updated_card['last_review']
            card.next_review = updated_card['next_review']
            card.review_count = updated_card['review_count']
        
        # Update average response time
        if card.avg_time == 0:
            card.avg_time = rt
        else:
            card.avg_time = (card.avg_time + rt) / 2
        
        # Track correct answers
        if rating >= 3:
            session['study_correct'] = session.get('study_correct', 0) + 1
            if card.review_count >= 3:
                card.is_mastered = True
        
        # Update user stats
        current_user.total_studied = (current_user.total_studied or 0) + 1
        points = rating * 5
        current_user.total_points = (current_user.total_points or 0) + points
        session['study_points_earned'] = session.get('study_points_earned', 0) + points
        
        # Streak Calculation
        today = date.today()
        last_study = None
        if current_user.last_study_date:
            try:
                if isinstance(current_user.last_study_date, str):
                    last_study = datetime.fromisoformat(current_user.last_study_date).date()
                else:
                    last_study = current_user.last_study_date
            except Exception:
                pass
                
        old_streak = current_user.streak or 0
        if last_study == today - timedelta(days=1):
            current_user.streak = old_streak + 1
        elif last_study != today:
            current_user.streak = 1
            
        current_user.last_study_date = today.isoformat()
        
        # Update stars
        new_stars = current_user.total_points // 100
        if new_stars > (current_user.stars or 0):
            current_user.stars = new_stars
            
        # Save Review Log
        review = CardReview(
            card_id=card.id,
            user_id=current_user.id,
            rating=rating,
            response_time=rt,
            created_at=datetime.now()
        )
        db.session.add(review)
        
        # Increment index for the next card
        session['study_idx'] = session.get('study_idx', 0) + 1
        
        try:
            db.session.commit()
            return jsonify({"status": "success"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Database error"}), 500