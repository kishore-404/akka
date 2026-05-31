import zipfile
from io import BytesIO
from flask import jsonify, request, send_file
from flask_login import login_required, current_user
from datetime import datetime
from models import db, User, Card, Deck, QuizResult, CardReview
from sqlalchemy import func

def register_admin_routes(app):

    # ============================================================
    # ADMIN DASHBOARD API
    # ============================================================
    @app.route('/admin_dashboard', methods=['GET'])
    @login_required
    def api_admin_dashboard():
        """API endpoint to get all students' data and activities"""
        
        # Security Check: Role-based + Hardcoded fallbacks
        if not getattr(current_user, 'is_admin', False) and current_user.username not in ['admin', 'Joseph Mercy Buela', 'Kishore', 'Buela']:
            return jsonify({'error': 'Access denied! Admin only.'}), 403
        
        # Fetch all non-admin students
        students = User.query.filter(
            User.username.notin_(['admin', 'Joseph Mercy Buela', 'Kishore', 'Buela']),
            (User.is_admin == False) | (User.is_admin == None)
        ).all()
        
        students_data = []
        total_cards_studied = 0
        total_quizzes = 0
        fsrs_wins = 0
        sm2_wins = 0
        total_retention_improvement = 0
        recent_activities = []
        
        for student in students:
            # Get reviews
            fsrs_reviews = CardReview.query.join(Card).join(Deck).filter(
                Deck.user_id == student.id,
                Card.algorithm == 'FSRS'
            ).all()
            
            sm2_reviews = CardReview.query.join(Card).join(Deck).filter(
                Deck.user_id == student.id,
                Card.algorithm.in_(['SM2', 'SM-2'])
            ).all()
            
            # Calculate metrics
            fsrs_correct = sum(1 for r in fsrs_reviews if r.rating >= 3)
            fsrs_retention = round((fsrs_correct / len(fsrs_reviews) * 100), 1) if fsrs_reviews else 0
            
            sm2_correct = sum(1 for r in sm2_reviews if r.rating >= 3)
            sm2_retention = round((sm2_correct / len(sm2_reviews) * 100), 1) if sm2_reviews else 0
            
            # Quiz count
            quiz_count = QuizResult.query.filter_by(user_id=student.id).count()
            
            total_cards_studied += student.total_studied or 0
            total_quizzes += quiz_count
            
            if fsrs_retention > sm2_retention:
                fsrs_wins += 1
                winner = 'FSRS'
            elif sm2_retention > fsrs_retention:
                sm2_wins += 1
                winner = 'SM-2'
            elif fsrs_reviews or sm2_reviews:
                winner = 'Tie'
            else:
                winner = 'N/A'
            
            students_data.append({
                'id': student.id,
                'username': student.username,
                'email': student.email,
                'total_studied': student.total_studied or 0,
                'total_points': student.total_points or 0,
                'streak': student.streak or 0,
                'quiz_count': quiz_count,
                'fsrs_retention': fsrs_retention,
                'sm2_retention': sm2_retention,
                'fsrs_reviews': len(fsrs_reviews),
                'sm2_reviews': len(sm2_reviews),
                'winner': winner
            })
            
            total_retention_improvement += (fsrs_retention - sm2_retention)
            
            # Get recent activities (last 5 reviews)
            recent_reviews = CardReview.query.join(Card).join(Deck).filter(
                Deck.user_id == student.id
            ).order_by(CardReview.created_at.desc()).limit(5).all()
            
            for review in recent_reviews:
                rating_display = getattr(review, 'rating_text', str(review.rating))
                recent_activities.append({
                    'time': review.created_at.strftime('%Y-%m-%d %H:%M'),
                    'student': student.username,
                    'type': '📝 Card Review',
                    'details': f'Rated "{review.card.question[:30]}..." as {rating_display} ({review.response_time:.1f}s)'
                })
            
            # Get recent quizzes
            recent_quizzes = QuizResult.query.filter_by(user_id=student.id).order_by(QuizResult.created_at.desc()).limit(3).all()
            for quiz in recent_quizzes:
                recent_activities.append({
                    'time': quiz.created_at.strftime('%Y-%m-%d %H:%M'),
                    'student': student.username,
                    'type': '📝 Quiz Completed',
                    'details': f'Score: {quiz.score}/{quiz.total_questions} ({quiz.percentage:.0f}%)'
                })
        
        # Sort activities by time (most recent first)
        recent_activities.sort(key=lambda x: x['time'], reverse=True)
        recent_activities = recent_activities[:20]  # Show last 20 activities
        
        total_students = len(students)
        avg_retention = round(sum(s['fsrs_retention'] for s in students_data) / total_students, 1) if total_students > 0 else 0
        avg_retention_improvement = round(total_retention_improvement / total_students, 1) if total_students > 0 else 0
        
        return jsonify({
            'students': students_data,
            'total_students': total_students,
            'total_cards_studied': total_cards_studied,
            'total_quizzes': total_quizzes,
            'avg_retention': avg_retention,
            'fsrs_wins': fsrs_wins,
            'sm2_wins': sm2_wins,
            'avg_retention_improvement': avg_retention_improvement,
            'recent_activities': recent_activities
        }), 200

    # ============================================================
    # ADMIN EXPORT ROUTE
    # ============================================================
    @app.route('/admin_export_all', methods=['GET'])
    @login_required
    def api_admin_export_all():
        """Export ALL students' data as ZIP for research"""
        
        if not getattr(current_user, 'is_admin', False) and current_user.username not in ['admin', 'Joseph Mercy Buela', 'Kishore', 'Buela']:
            return jsonify({'error': 'Access denied! Admin only.'}), 403
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_buffer = BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            all_students = []
            users = User.query.filter(
                User.username.notin_(['admin', 'Joseph Mercy Buela', 'Kishore', 'Buela']),
                (User.is_admin == False) | (User.is_admin == None)
            ).all()
            
            for user in users:
                fsrs_cards = Card.query.join(Deck).filter(Deck.user_id == user.id, Card.algorithm == 'FSRS').all()
                sm2_cards = Card.query.join(Deck).filter(Deck.user_id == user.id, Card.algorithm.in_(['SM2', 'SM-2'])).all()
                
                fsrs_reviews = CardReview.query.join(Card).join(Deck).filter(Deck.user_id == user.id, Card.algorithm == 'FSRS').all()
                sm2_reviews = CardReview.query.join(Card).join(Deck).filter(Deck.user_id == user.id, Card.algorithm.in_(['SM2', 'SM-2'])).all()
                
                fsrs_correct = sum(1 for r in fsrs_reviews if r.rating >= 3)
                fsrs_retention = round((fsrs_correct / len(fsrs_reviews) * 100), 1) if fsrs_reviews else 0
                
                sm2_correct = sum(1 for r in sm2_reviews if r.rating >= 3)
                sm2_retention = round((sm2_correct / len(sm2_reviews) * 100), 1) if sm2_reviews else 0
                
                all_students.append({
                    'Student ID': user.id,
                    'Username': user.username,
                    'Email': user.email,
                    'Total Cards Studied': user.total_studied or 0,
                    'Total Points': user.total_points or 0,
                    'Streak': user.streak or 0,
                    'FSRS Retention (%)': fsrs_retention,
                    'SM2 Retention (%)': sm2_retention,
                    'FSRS Cards': len(fsrs_cards),
                    'SM2 Cards': len(sm2_cards),
                    'FSRS Reviews': len(fsrs_reviews),
                    'SM2 Reviews': len(sm2_reviews),
                })
            
            if all_students:
                keys = all_students[0].keys()
                master_csv = ','.join(keys) + '\n'
                for student in all_students:
                    master_csv += ','.join(str(student[k]) for k in keys) + '\n'
                zip_file.writestr(f'all_students_data_{timestamp}.csv', master_csv)
        
        zip_buffer.seek(0)
        
        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'research_data_all_students_{timestamp}.zip'
        )
        

    # ============================================================
    # 1. THE STRUGGLE MATRIX (Content Analytics)
    # ============================================================
    @app.route('/admin/struggle_matrix', methods=['GET'])
    @login_required
    def api_struggle_matrix():
        if not getattr(current_user, 'is_admin', False) and current_user.username not in ['admin', 'Buela', 'Kishore']:
            return jsonify({'error': 'Unauthorized'}), 403

        # Aggregate reviews to find the hardest cards (Avg rating < 3.0)
        struggling_cards = db.session.query(
            Card.id,
            Card.question,
            Deck.name.label('deck_name'),
            func.avg(CardReview.rating).label('avg_rating'),
            func.count(CardReview.id).label('total_attempts')
        ).join(CardReview, Card.id == CardReview.card_id)\
         .join(Deck, Card.deck_id == Deck.id)\
         .group_by(Card.id, Deck.name)\
         .having(func.avg(CardReview.rating) < 3.5)\
         .order_by('avg_rating').limit(10).all()

        matrix_data = [
            {
                "card_id": c.id,
                "question": c.question[:80] + "..." if len(c.question) > 80 else c.question,
                "deck": c.deck_name,
                "avg_rating": round(c.avg_rating, 2),
                "total_attempts": c.total_attempts
            } for c in struggling_cards
        ]

        return jsonify({"struggle_matrix": matrix_data}), 200

    # ============================================================
    # 2. USER MANAGEMENT CRUD (Edit / Delete Students)
    # ============================================================
    @app.route('/admin/users/<int:user_id>', methods=['PUT', 'DELETE'])
    @login_required
    def api_manage_users(user_id):
        if not getattr(current_user, 'is_admin', False) and current_user.username not in ['admin', 'Buela', 'Kishore']:
            return jsonify({'error': 'Unauthorized'}), 403

        user = User.query.get_or_404(user_id)

        # Protect admins from deleting each other
        if user.is_admin and request.method == 'DELETE':
            return jsonify({'error': 'Cannot delete an administrator.'}), 403

        if request.method == 'DELETE':
            db.session.delete(user)
            db.session.commit()
            return jsonify({"message": f"User {user.username} deleted successfully."}), 200

        if request.method == 'PUT':
            data = request.get_json()
            
            # Manual points/stars assignment
            if 'total_points' in data:
                user.total_points = data['total_points']
            if 'stars' in data:
                user.stars = data['stars']
            
            db.session.commit()
            return jsonify({"message": f"User {user.username} updated successfully."}), 200