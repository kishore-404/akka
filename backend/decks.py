# decks.py
from flask import request, jsonify
from flask_login import login_required, current_user
from models import db, Deck, Card

def register_decks_routes(app):
    
    # Get all decks for the materials page
    @app.route('/materials_data', methods=['GET'])
    @login_required
    def get_materials():
        decks = Deck.query.filter_by(user_id=current_user.id).all()
        decks_data = []
        for deck in decks:
            decks_data.append({
                "id": deck.id,
                "name": deck.name,
                "subject": getattr(deck, 'subject', 'General'),
                "card_count": len(deck.cards)
            })
        return jsonify({"decks": decks_data}), 200

    @app.route('/create_deck', methods=['POST'])
    @login_required
    def create_deck():
        name = request.form.get('name')
        subject = request.form.get('subject', 'General')
        if name:
            deck = Deck(name=name, subject=subject, user_id=current_user.id)
            db.session.add(deck)
            db.session.commit()
            return jsonify({"status": "success", "message": f'Deck "{name}" created!'}), 201
        return jsonify({"error": "Deck name is required"}), 400
    
    @app.route('/delete_deck/<int:deck_id>', methods=['DELETE'])
    @login_required
    def delete_deck(deck_id):
        deck = db.session.get(Deck, deck_id)
        if deck and deck.user_id == current_user.id:
            db.session.delete(deck)
            db.session.commit()
            return jsonify({"status": "success", "message": "Deck deleted!"}), 200
        return jsonify({"error": "Deck not found or unauthorized"}), 403
    
    @app.route('/deck_data/<int:deck_id>', methods=['GET'])
    @login_required
    def view_deck(deck_id):
        deck = db.session.get(Deck, deck_id)
        if not deck or deck.user_id != current_user.id:
            return jsonify({"error": "Deck not found or unauthorized"}), 403
            
        cards_data = [{
            "id": c.id,
            "question": c.question,
            "answer": c.answer,
            "is_mastered": c.is_mastered,
            "review_count": c.review_count,
            "difficulty": c.difficulty
        } for c in deck.cards]
        
        return jsonify({
            "deck": {
                "id": deck.id,
                "name": deck.name,
                "subject": getattr(deck, 'subject', 'General')
            },
            "cards": cards_data
        }), 200
    
    @app.route('/add_card/<int:deck_id>', methods=['POST'])
    @login_required
    def add_card(deck_id):
        deck = db.session.get(Deck, deck_id)
        if not deck or deck.user_id != current_user.id:
            return jsonify({"error": "Deck not found"}), 403
            
        # Handle both JSON and form data for flexibility
        data = request.get_json() if request.is_json else request.form
        question = data.get('question')
        answer = data.get('answer')
        
        if question and answer:
            card = Card(
                question=question, 
                answer=answer, 
                deck_id=deck.id,
                algorithm='SM2',
                stability=2.0,
                difficulty=5.0,
                e_factor=2.5,
                interval=1
            )
            db.session.add(card)
            db.session.commit()
            return jsonify({"status": "success", "message": "Card added!"}), 201
            
        return jsonify({"error": "Question and answer are required!"}), 400
    
    @app.route('/delete_card/<int:card_id>', methods=['DELETE'])
    @login_required
    def delete_card(card_id):
        card = db.session.get(Card, card_id)
        if card and card.deck.user_id == current_user.id:
            db.session.delete(card)
            db.session.commit()
            return jsonify({"status": "success", "message": "Card deleted!"}), 200
        return jsonify({"error": "Card not found"}), 404

    @app.route('/toggle_mastered/<int:card_id>', methods=['POST'])
    @login_required
    def toggle_mastered(card_id):
        card = db.session.get(Card, card_id)
        if not card or card.deck.user_id != current_user.id:
            return jsonify({'error': 'Permission denied'}), 403
            
        card.is_mastered = not card.is_mastered
        db.session.commit()
        
        return jsonify({
            'success': True,
            'is_mastered': card.is_mastered
        }), 200