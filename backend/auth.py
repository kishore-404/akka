import random
from flask import request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from flask_mail import Message
from models import db, User, create_decks_for_new_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date, timedelta

# Note: Import 'mail' from your main app file
# e.g., from app import mail 

def register_auth_routes(app, mail):

    @app.route('/login', methods=['POST'])
    def api_login():
        data = request.get_json() or request.form
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            
            is_admin = getattr(user, 'is_admin', False) or user.username in ['admin', 'Buela', 'Kishore']
            
            if is_admin:
                # 1. Generate 6-digit OTP
                otp = str(random.randint(100000, 999999))
                user.otp_code = generate_password_hash(otp) 
                user.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
                db.session.commit()

                # 2. Send the Email (For Real This Time!)
                try:
                    msg = Message("Admin Login OTP - Auxilium Portal", recipients=[user.email])
                    msg.body = f"Hello {user.username},\n\nYour Admin Login OTP is: {otp}\n\nThis code expires in 10 minutes. Do not share this with anyone."
                    mail.send(msg)
                except Exception as e:
                    print(f"Mail Error: {e}")
                    # 🌟 We added the error return back!
                    return jsonify({"error": "Failed to send OTP email. Please check server email credentials."}), 500

                # 3. Halt login and tell React to ask for OTP
                return jsonify({
                    "status": "pending",
                    "requires_otp": True,
                    "username": user.username,
                    "message": "OTP sent securely to your email."
                }), 200

            # --- NORMAL STUDENT LOGIN (No OTP) ---
            login_user(user)
            
            today = date.today()
            last_study = user.last_study_date
            if last_study:
                try:
                    if isinstance(last_study, str):
                        last_study = datetime.fromisoformat(last_study).date()
                except:
                    last_study = None

            if last_study == today:
                pass
            elif last_study == today - timedelta(days=1):
                user.streak = (user.streak or 0) + 1
            else:
                user.streak = 1

            user.last_study_date = today.isoformat()
            db.session.commit()

            return jsonify({
                "status": "success", 
                "message": f"Welcome back, {username}!",
                "redirect": '/dashboard'
            }), 200
        
        return jsonify({"error": "Invalid username or password. Please try again."}), 401

    @app.route('/verify_otp', methods=['POST'])
    def api_verify_otp():
        data = request.get_json()
        username = data.get('username')
        otp_attempt = data.get('otp')

        user = User.query.filter_by(username=username).first()
        
        if not user or not user.otp_code or not user.otp_expiry:
            return jsonify({"error": "Invalid session. Please log in again."}), 400

        # Check Expiry
        if datetime.utcnow() > user.otp_expiry:
            return jsonify({"error": "OTP has expired. Please log in again."}), 401

        # Verify OTP
        if check_password_hash(user.otp_code, otp_attempt):
            # Clear OTP data
            user.otp_code = None
            user.otp_expiry = None
            db.session.commit()

            login_user(user)
            return jsonify({
                "status": "success", 
                "message": "Admin verification complete.",
                "redirect": '/admin_dashboard'
            }), 200
            
        return jsonify({"error": "Incorrect OTP."}), 401
    
    @app.route('/current_user', methods=['GET'])
    @login_required
    def get_current_user():
        """Allows React to check if the current session belongs to an Admin or Student."""
        is_admin = getattr(current_user, 'is_admin', False) or current_user.username in ['admin', 'Buela', 'Kishore']
        
        return jsonify({
            "username": current_user.username,
            "email": current_user.email,
            "is_admin": is_admin
        }), 200

    @app.route('/register', methods=['POST'])
    def api_register():
        data = request.get_json() or request.form
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirm_password')

        if password != confirm_password: return jsonify({"error": "Passwords do not match!"}), 400
        if len(password) < 4: return jsonify({"error": "Password must be at least 4 characters!"}), 400
        if User.query.filter_by(username=username).first(): return jsonify({"error": "Username already exists!"}), 409
        if User.query.filter_by(email=email).first(): return jsonify({"error": "Email is already registered!"}), 409

        try:
            user_count = User.query.count()
            new_user = User(
                username=username,
                email=email,
                is_admin=(user_count == 0), 
                password=generate_password_hash(password, method='pbkdf2:sha256'),
                total_points=0, total_studied=0, streak=0, unlocked_decks=999, stars=0
            )
            db.session.add(new_user)
            db.session.flush()

            create_decks_for_new_user(new_user.id)
            db.session.commit()

            # 🚨 SEND WELCOME EMAIL
            try:
                msg = Message("Welcome to the Auxilium Python Course!", recipients=[email])
                msg.html = f"""
                <h2>Welcome aboard, {username}! 🐍</h2>
                <p>Your account has been successfully created.</p>
                <p>You now have access to our smart spaced-repetition engine and the hands-free AI Tutor, Buddy.</p>
                <br>
                <p>Happy coding,<br>The Auxilium Team</p>
                """
                mail.send(msg)
            except Exception as e:
                print(f"Welcome Email Failed (User registered successfully though): {e}")

            login_user(new_user)
            
            is_admin = getattr(new_user, 'is_admin', False) or new_user.username in ['admin', 'Buela', 'Kishore']
            return jsonify({
                "status": "success", 
                "message": "Registration successful!",
                "redirect": '/admin_dashboard' if is_admin else '/dashboard'
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Registration failed due to a server error."}), 500

    @app.route('/logout', methods=['GET', 'POST'])
    @login_required
    def api_logout():
        logout_user()
        return jsonify({"status": "success", "message": "Successfully logged out"}), 200