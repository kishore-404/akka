# research.py
# research.py
from flask import render_template, flash, jsonify, redirect, url_for
from flask_login import login_required, current_user
from models import db, Card, Deck, QuizResult, CardReview, User
from datetime import datetime, date, timedelta
import numpy as np
from scipy import stats

def register_research_routes(app):
    
    # ========== HELPER FUNCTIONS ==========
    def calculate_retention_for_user(user_id, algorithm):
        reviews = CardReview.query.join(Card).join(Deck).filter(
            Deck.user_id == user_id, Card.algorithm == algorithm
        ).all()
        if not reviews: return None
        correct = sum(1 for r in reviews if r.rating >= 3)
        return (correct / len(reviews)) * 100
    
    def calculate_reviews_per_card(user_id, algorithm):
        cards = Card.query.join(Deck).filter(Deck.user_id == user_id, Card.algorithm == algorithm).all()
        reviews = CardReview.query.join(Card).join(Deck).filter(Deck.user_id == user_id, Card.algorithm == algorithm).all()
        if not cards or not reviews: return None
        return len(reviews) / len(cards)
    
    def calculate_response_time(user_id, algorithm):
        reviews = CardReview.query.join(Card).join(Deck).filter(Deck.user_id == user_id, Card.algorithm == algorithm).all()
        if not reviews: return None
        return sum(r.response_time for r in reviews) / len(reviews)
    
    def perform_ttest(data1, data2, test_name="Comparison"):
        data1 = [float(d) for d in data1 if d is not None]
        data2 = [float(d) for d in data2 if d is not None]
        if len(data1) < 2 or len(data2) < 2: return None
        
        t_stat, p_value = stats.ttest_rel(data1, data2)
        mean1, mean2 = np.mean(data1), np.mean(data2)
        std1, std2 = np.std(data1, ddof=1), np.std(data2, ddof=1)
        pooled_std = np.sqrt((std1**2 + std2**2) / 2)
        cohens_d = (mean1 - mean2) / pooled_std if pooled_std > 0 else 0
        
        if p_value < 0.001: significance, stars = "Very Significant", "***"
        elif p_value < 0.01: significance, stars = "Significant", "**"
        elif p_value < 0.05: significance, stars = "Marginally Significant", "*"
        else: significance, stars = "Not Significant", "ns"
        
        return {
            't_statistic': round(float(t_stat), 3),
            'p_value': float(p_value),
            'p_value_formatted': f"{p_value:.4f}" if p_value >= 0.0001 else "< 0.0001",
            'significant': bool(p_value < 0.05),
            'significance_level': significance,
            'stars': stars,
            'cohens_d': round(float(cohens_d), 2),
            'effect_size': 'Large' if abs(cohens_d) > 0.8 else 'Medium' if abs(cohens_d) > 0.5 else 'Small',
            'mean_group1': round(float(mean1), 2),
            'mean_group2': round(float(mean2), 2),
            'std_group1': round(float(std1), 2),
            'std_group2': round(float(std2), 2),
            'n': len(data1)
        }
  
    # ========== RESEARCH DASHBOARD ROUTE ==========
    
    @app.route('/research_data', methods=['GET'])
    @login_required
    def research_data():
        try:
            total_cards = Card.query.join(Deck).filter(Deck.user_id == current_user.id).count()
            fsrs_count = Card.query.join(Deck).filter(Deck.user_id == current_user.id, Card.algorithm == 'FSRS').count()
            sm2_count = Card.query.join(Deck).filter(Deck.user_id == current_user.id, Card.algorithm.in_(['SM2', 'SM-2'])).count()
            
            fsrs_mastered = Card.query.join(Deck).filter(Deck.user_id == current_user.id, Card.algorithm == 'FSRS', Card.is_mastered == True).count()
            sm2_mastered = Card.query.join(Deck).filter(Deck.user_id == current_user.id, Card.algorithm.in_(['SM2', 'SM-2']), Card.is_mastered == True).count()
            total_mastered = fsrs_mastered + sm2_mastered
            
            fsrs_reviews = CardReview.query.join(Card).join(Deck).filter(Deck.user_id == current_user.id, Card.algorithm == 'FSRS').all()
            sm2_reviews = CardReview.query.join(Card).join(Deck).filter(Deck.user_id == current_user.id, Card.algorithm.in_(['SM2', 'SM-2'])).all()
            
            fsrs_retention = round((sum(1 for r in fsrs_reviews if r.rating >= 3) / len(fsrs_reviews)) * 100, 1) if fsrs_reviews else 0
            sm2_retention = round((sum(1 for r in sm2_reviews if r.rating >= 3) / len(sm2_reviews)) * 100, 1) if sm2_reviews else 0
            
            fsrs_cards = Card.query.join(Deck).filter(Deck.user_id == current_user.id, Card.algorithm == 'FSRS', Card.review_count > 0).all()
            sm2_cards = Card.query.join(Deck).filter(Deck.user_id == current_user.id, Card.algorithm.in_(['SM2', 'SM-2']), Card.review_count > 0).all()
            
            fsrs_avg_time = round(sum(c.avg_time for c in fsrs_cards) / len(fsrs_cards), 2) if fsrs_cards else 0
            sm2_avg_time = round(sum(c.avg_time for c in sm2_cards) / len(sm2_cards), 2) if sm2_cards else 0
            
            fsrs_reviews_avg = round(sum(c.review_count for c in fsrs_cards) / len(fsrs_cards), 1) if fsrs_cards else 0
            sm2_reviews_avg = round(sum(c.review_count for c in sm2_cards) / len(sm2_cards), 1) if sm2_cards else 0
            
            fsrs_confidence = round((fsrs_retention / 100) * 5, 1) if fsrs_retention > 0 else 0
            sm2_confidence = round((sm2_retention / 100) * 5, 1) if sm2_retention > 0 else 0
            
            # Winner Logic
            fsrs_score, sm2_score = 0, 0
            if fsrs_retention > sm2_retention: fsrs_score += 1
            elif sm2_retention > fsrs_retention: sm2_score += 1
            
            if 0 < fsrs_avg_time < sm2_avg_time: fsrs_score += 1
            elif 0 < sm2_avg_time < fsrs_avg_time: sm2_score += 1
            
            if 0 < fsrs_reviews_avg < sm2_reviews_avg: fsrs_score += 1
            elif 0 < sm2_reviews_avg < fsrs_reviews_avg: sm2_score += 1
            
            if fsrs_confidence > sm2_confidence: fsrs_score += 1
            elif sm2_confidence > fsrs_confidence: sm2_score += 1
            
            overall_winner = "FSRS" if fsrs_score > sm2_score else "SM-2" if sm2_score > fsrs_score else "Tie"
            if not fsrs_reviews and not sm2_reviews: overall_winner = "No data yet"
            
            # Recommendations
            recommendations = []
            if fsrs_retention < 50 and fsrs_reviews: recommendations.append("Study FSRS cards more frequently to improve retention.")
            if sm2_retention < 50 and sm2_reviews: recommendations.append("Review SM-2 cards regularly.")
            if fsrs_avg_time > 5: recommendations.append("Take more time to understand FSRS cards before answering.")
            if sm2_avg_time > 5: recommendations.append("Take more time to understand SM-2 cards before answering.")
            if not recommendations: recommendations.append("Keep up the great work! Your learning is on track.")
            
            # Achievements
            achievements = []
            if total_mastered >= 10: achievements.append({"title": "10 Cards Mastered", "icon": "📚"})
            if total_mastered >= 100: achievements.append({"title": "Bronze Scholar", "icon": "🥉"})
            if total_mastered >= 500: achievements.append({"title": "Golden Mind", "icon": "🏆"})
            if (current_user.streak or 0) >= 7: achievements.append({"title": "7 Day Streak", "icon": "🔥"})
            
            return jsonify({
                "stats": {
                    "total_cards": total_cards, "total_mastered": total_mastered,
                    "fsrs_count": fsrs_count, "sm2_count": sm2_count,
                    "fsrs_mastered": fsrs_mastered, "sm2_mastered": sm2_mastered,
                },
                "comparison": {
                    "fsrs": {
                        "retention": fsrs_retention, "avg_time": fsrs_avg_time,
                        "reviews_avg": fsrs_reviews_avg, "confidence": fsrs_confidence
                    },
                    "sm2": {
                        "retention": sm2_retention, "avg_time": sm2_avg_time,
                        "reviews_avg": sm2_reviews_avg, "confidence": sm2_confidence
                    }
                },
                "overall_winner": overall_winner,
                "recommendations": recommendations,
                "achievements": achievements,
                "has_data": total_cards > 0
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ========== ADMIN STATISTICS ROUTE ==========
    @app.route('/research_statistics', methods=['GET'])
    @login_required
    def api_research_statistics():
        if not current_user.is_admin:
            return jsonify({'error': 'Access denied: Admin privileges required'}), 403
            
        students = User.query.filter(~User.username.in_(['admin', 'Buela'])).all()
        fsrs_ret, sm2_ret, fsrs_rpc, sm2_rpc, fsrs_rt, sm2_rt = [], [], [], [], [], []
        
        for student in students:
            fr = calculate_retention_for_user(student.id, 'FSRS')
            sr = calculate_retention_for_user(student.id, 'SM2')
            if fr is not None and sr is not None:
                fsrs_ret.append(fr)
                sm2_ret.append(sr)
                
            frpc = calculate_reviews_per_card(student.id, 'FSRS')
            srpc = calculate_reviews_per_card(student.id, 'SM2')
            if frpc is not None and srpc is not None:
                fsrs_rpc.append(frpc)
                sm2_rpc.append(srpc)
                
            frt = calculate_response_time(student.id, 'FSRS')
            srt = calculate_response_time(student.id, 'SM2')
            if frt is not None and srt is not None:
                fsrs_rt.append(frt)
                sm2_rt.append(srt)
                
        return jsonify({
            "total_students": len(students),
            "ttests": {
                "retention": perform_ttest(fsrs_ret, sm2_ret, "Retention Rate"),
                "reviews": perform_ttest(fsrs_rpc, sm2_rpc, "Reviews per Card"),
                "response": perform_ttest(fsrs_rt, sm2_rt, "Response Time")
            }
        }), 200
    # ========== T-TEST STATISTICS ROUTE ==========
    
    @app.route('/research/statistics')
    @login_required
    def research_statistics():
        """Statistical analysis page with T-Test results"""
        
        # Only admin can view statistics (or any user for their own data)
        if current_user.username != 'admin' and current_user.username != 'Buela':
            flash('Access denied! Research statistics are available for admin only.', 'error')
            return redirect(url_for('research'))
        
        # Get all students (exclude admin)
        students = User.query.filter(
            User.username != 'admin', 
            User.username != 'Buela'
        ).all()
        
        # Collect data for each student
        fsrs_retention = []
        sm2_retention = []
        fsrs_reviews_per_card = []
        sm2_reviews_per_card = []
        fsrs_response_time = []
        sm2_response_time = []
        
        for student in students:
            # Retention rates
            fsrs_ret = calculate_retention_for_user(student.id, 'FSRS')
            sm2_ret = calculate_retention_for_user(student.id, 'SM2')
            if fsrs_ret is not None and sm2_ret is not None:
                fsrs_retention.append(fsrs_ret)
                sm2_retention.append(sm2_ret)
            
            # Reviews per card
            fsrs_rpc = calculate_reviews_per_card(student.id, 'FSRS')
            sm2_rpc = calculate_reviews_per_card(student.id, 'SM2')
            if fsrs_rpc is not None and sm2_rpc is not None:
                fsrs_reviews_per_card.append(fsrs_rpc)
                sm2_reviews_per_card.append(sm2_rpc)
            
            # Response time
            fsrs_rt = calculate_response_time(student.id, 'FSRS')
            sm2_rt = calculate_response_time(student.id, 'SM2')
            if fsrs_rt is not None and sm2_rt is not None:
                fsrs_response_time.append(fsrs_rt)
                sm2_response_time.append(sm2_rt)
        
        # Perform T-Tests
        retention_ttest = perform_ttest(fsrs_retention, sm2_retention, "Retention Rate")
        reviews_ttest = perform_ttest(fsrs_reviews_per_card, sm2_reviews_per_card, "Reviews per Card")
        response_ttest = perform_ttest(fsrs_response_time, sm2_response_time, "Response Time")
        
        # Calculate overall statistics
        total_students = len(students)
        avg_fsrs_retention = sum(fsrs_retention) / len(fsrs_retention) if fsrs_retention else 0
        avg_sm2_retention = sum(sm2_retention) / len(sm2_retention) if sm2_retention else 0
        improvement = avg_fsrs_retention - avg_sm2_retention
        
        return render_template('research_statistics.html',
                             total_students=total_students,
                             retention_ttest=retention_ttest,
                             reviews_ttest=reviews_ttest,
                             response_ttest=response_ttest,
                             avg_fsrs_retention=round(avg_fsrs_retention, 1),
                             avg_sm2_retention=round(avg_sm2_retention, 1),
                             improvement=round(improvement, 1))
    
    # ========== API ENDPOINT ==========
    
    @app.route('/deck_progress/<int:deck_id>')
    @login_required
    def deck_progress(deck_id):
        """API endpoint to get real-time progress for a deck"""
        deck = Deck.query.get(deck_id)
        if not deck or deck.user_id != current_user.id:
            return jsonify({'error': 'Deck not found'}), 404
        
        # Get FSRS cards
        fsrs_cards = Card.query.filter_by(deck_id=deck.id, algorithm='FSRS').all()
        fsrs_total = len(fsrs_cards)
        fsrs_mastered = sum(1 for c in fsrs_cards if c.is_mastered)
        
        # Get SM-2 cards
        sm2_cards = Card.query.filter_by(deck_id=deck.id, algorithm='SM2').all()
        sm2_total = len(sm2_cards)
        sm2_mastered = sum(1 for c in sm2_cards if c.is_mastered)
        
        # Calculate retention from reviews
        fsrs_reviews = CardReview.query.join(Card).filter(
            Card.deck_id == deck.id,
            Card.algorithm == 'FSRS',
            CardReview.user_id == current_user.id
        ).all()
        
        sm2_reviews = CardReview.query.join(Card).filter(
            Card.deck_id == deck.id,
            Card.algorithm == 'SM2',
            CardReview.user_id == current_user.id
        ).all()
        
        fsrs_retention = 0
        if fsrs_reviews:
            correct = sum(1 for r in fsrs_reviews if r.rating >= 3)
            fsrs_retention = round((correct / len(fsrs_reviews)) * 100, 1)
        
        sm2_retention = 0
        if sm2_reviews:
            correct = sum(1 for r in sm2_reviews if r.rating >= 3)
            sm2_retention = round((correct / len(sm2_reviews)) * 100, 1)
        
        return jsonify({
            'fsrs': {
                'total': fsrs_total,
                'mastered': fsrs_mastered,
                'retention': fsrs_retention
            },
            'sm2': {
                'total': sm2_total,
                'mastered': sm2_mastered,
                'retention': sm2_retention
            }
        })