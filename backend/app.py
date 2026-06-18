from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_connection
from model import predict_expense
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import os
import random
import smtplib
from email.mime.text import MIMEText
import requests
from dotenv import load_dotenv
import re

load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow all origins for development

def db_error(e):
    print(f"DB Error: {e}")
    return jsonify({"error": str(e)}), 500

@app.route("/")
def home():
    return jsonify({"status": "Finance Analyzer API running"})

# ── Authentication ───────────────────────────────────────────────────────────

OTP_STORE = {}

def send_email(to_email, subject, body):
    sender_email = os.getenv("SMTP_EMAIL")
    sender_password = os.getenv("SMTP_APP_PASSWORD")
    if not sender_email or not sender_password or "your_email" in sender_email:
        print("SMTP Credentials not configured. Simulated OTP sent to console.")
        return True
    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = f"Finance Analyzer <{sender_email}>"
        msg['To'] = to_email
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def verify_recaptcha(token):
    secret = os.getenv("RECAPTCHA_SECRET_KEY")
    if not secret:
        print("reCAPTCHA secret not configured, skipping validation.")
        return True
    try:
        response = requests.post("https://www.google.com/recaptcha/api/siteverify", data={
            "secret": secret,
            "response": token
        })
        return response.json().get("success", False)
    except Exception as e:
        print(f"reCAPTCHA error: {e}")
        return False

@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    try:
        data = request.get_json(force=True)
        email = data.get("email", "").strip()
        recaptcha_token = data.get("recaptcha_token", "")
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
            
        if not recaptcha_token or not verify_recaptcha(recaptcha_token):
            return jsonify({"error": "Invalid reCAPTCHA"}), 400

        otp = str(random.randint(100000, 999999))
        
        OTP_STORE[email] = {
            "otp": otp,
            "expires": datetime.now() + timedelta(minutes=5)
        }
        
        print(f"--- OTP FOR {email}: {otp} ---")
        
        send_email(email, "Your Finance Analyzer OTP", f"Your OTP is: {otp}\nIt is valid for 5 minutes.")
        
        return jsonify({"message": "OTP sent successfully"}), 200
    except Exception as e:
        return db_error(e)

@app.route("/api/auth/resend-otp", methods=["POST"])
def resend_otp():
    try:
        data = request.get_json(force=True)
        email = data.get("email", "").strip()
        
        if email not in OTP_STORE:
            return jsonify({"error": "No pending OTP request found. Please go back and try again."}), 400
            
        otp = str(random.randint(100000, 999999))
        OTP_STORE[email] = {
            "otp": otp,
            "expires": datetime.now() + timedelta(minutes=5)
        }
        
        print(f"--- RESEND OTP FOR {email}: {otp} ---")
        send_email(email, "Your Finance Analyzer OTP (Resent)", f"Your new OTP is: {otp}\nIt is valid for 5 minutes.")
        
        return jsonify({"message": "OTP resent successfully"}), 200
    except Exception as e:
        return db_error(e)

@app.route("/api/auth/register", methods=["POST"])
def register():
    conn = None
    cur = None
    try:
        data = request.get_json(force=True)
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "")
        pin = data.get("security_pin", "").strip()
        otp = data.get("otp", "").strip()

        if not name or not email or not password or not otp:
            return jsonify({"error": "All fields are required"}), 400
            
        if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", password):
            return jsonify({"error": "Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character."}), 400
            
        if email not in OTP_STORE or OTP_STORE[email]["otp"] != otp:
            return jsonify({"error": "Invalid or expired OTP"}), 400
            
        if datetime.now() > OTP_STORE[email]["expires"]:
            del OTP_STORE[email]
            return jsonify({"error": "OTP has expired"}), 400
        
        conn = get_connection()
        cur = conn.cursor()
        
        # Check if email exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({"error": "Email already registered"}), 400

        hashed_pw = generate_password_hash(password)
        cur.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
            (name, email, hashed_pw)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        
        # Clear OTP after successful registration
        del OTP_STORE[email]

        return jsonify({"message": "Registration successful", "user_id": new_id, "name": name, "email": email}), 201
    except Exception as e:
        return db_error(e)
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json(force=True)
        email = data.get("email", "").strip()
        password = data.get("password", "")
        recaptcha_token = data.get("recaptcha_token", "")

        if not recaptcha_token or not verify_recaptcha(recaptcha_token):
            return jsonify({"error": "Invalid reCAPTCHA"}), 400

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, name, password_hash FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user or not check_password_hash(user[2], password):
            return jsonify({"error": "Invalid email or password"}), 401
            
        # Generate OTP
        otp = str(random.randint(100000, 999999))
        OTP_STORE[email] = {
            "otp": otp,
            "expires": datetime.now() + timedelta(minutes=5)
        }
        
        print(f"--- LOGIN OTP FOR {email}: {otp} ---")
        send_email(email, "Login OTP - Finance Analyzer", f"Your login OTP is: {otp}\nIt is valid for 5 minutes.")
            
        return jsonify({"message": "OTP sent", "email": email}), 200
    except Exception as e:
        return db_error(e)

@app.route("/api/auth/verify-login", methods=["POST"])
def verify_login():
    try:
        data = request.get_json(force=True)
        email = data.get("email", "").strip()
        otp = data.get("otp", "").strip()
        
        if email not in OTP_STORE or OTP_STORE[email]["otp"] != otp:
            return jsonify({"error": "Invalid or expired OTP"}), 401
            
        if datetime.now() > OTP_STORE[email]["expires"]:
            del OTP_STORE[email]
            return jsonify({"error": "OTP has expired"}), 401
            
        del OTP_STORE[email]
        
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify({"message": "Login successful", "user": {"id": user[0], "name": user[1], "email": email}}), 200
    except Exception as e:
        return db_error(e)

@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json(force=True)
        email = data.get("email", "").strip()
        otp = data.get("otp", "").strip()
        new_password = data.get("new_password", "")

        if not email or not otp or not new_password:
            return jsonify({"error": "All fields are required"}), 400

        if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", new_password):
            return jsonify({"error": "Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character."}), 400

        if email not in OTP_STORE or OTP_STORE[email]["otp"] != otp:
            return jsonify({"error": "Invalid or expired OTP"}), 401
            
        if datetime.now() > OTP_STORE[email]["expires"]:
            del OTP_STORE[email]
            return jsonify({"error": "OTP has expired"}), 401

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

        if not user:
            cur.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404

        # valid OTP and User, reset password
        del OTP_STORE[email]
        
        hashed_pw = generate_password_hash(new_password)
        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hashed_pw, user[0]))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Password reset successful. You can now login."}), 200
    except Exception as e:
        return db_error(e)

# ── Categories ───────────────────────────────────────────────────────────────
@app.route("/api/categories", methods=["GET"])
def get_categories():
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute("SELECT id, name, type FROM categories ORDER BY name ASC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([{"id": r[0], "name": r[1], "type": r[2]} for r in rows])
    except Exception as e:
        return db_error(e)

# ── Add transaction ──────────────────────────────────────────────────────────
@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No data received"}), 400

        amount          = float(data.get("amount", 0))
        category        = str(data.get("category", "")).strip()
        custom_category = str(data.get("custom_category", "")).strip()
        tx_type         = str(data.get("type", "")).strip()
        date            = str(data.get("date", datetime.now().strftime("%Y-%m-%d")))
        notes           = str(data.get("notes", "")).strip()
        user_id         = int(data.get("user_id", 1))

        if amount <= 0:
            return jsonify({"error": "Amount must be positive"}), 400
        if not category:
            return jsonify({"error": "Category is required"}), 400
        if tx_type not in ("in", "out"):
            return jsonify({"error": "type must be 'in' or 'out'"}), 400

        conn = get_connection()
        cur  = conn.cursor()
        cur.execute(
            """INSERT INTO transactions (user_id, amount, category, custom_category, type, date, notes)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING transaction_id""",
            (user_id, amount, category, custom_category if custom_category else None, tx_type, date, notes)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Transaction added", "transaction_id": new_id}), 201

    except Exception as e:
        return db_error(e)

# ── Get all transactions ─────────────────────────────────────────────────────
@app.route("/api/transactions/<int:user_id>", methods=["GET"])
def get_transactions(user_id):
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute(
            """SELECT transaction_id, user_id, amount, category, custom_category, type, date, notes
               FROM transactions WHERE user_id = %s
               ORDER BY date DESC, transaction_id DESC""",
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([
            {
                "transaction_id": r[0],
                "user_id": r[1],
                "amount": float(r[2]),
                "category": r[3],
                "custom_category": r[4],
                "type": r[5],
                "date": str(r[6]),
                "notes": r[7]
            }
            for r in rows
        ])
    except Exception as e:
        return db_error(e)

# ── Delete transaction ───────────────────────────────────────────────────────
@app.route("/api/transactions/<int:tx_id>", methods=["DELETE"])
def delete_transaction(tx_id):
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute("DELETE FROM transactions WHERE transaction_id = %s", (tx_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Deleted"})
    except Exception as e:
        return db_error(e)

# ── Summary ──────────────────────────────────────────────────────────────────
@app.route("/api/summary/<int:user_id>", methods=["GET"])
def summary(user_id):
    try:
        conn = get_connection()
        cur  = conn.cursor()
        now  = datetime.now()
        month_start = f"{now.year}-{str(now.month).zfill(2)}-01"

        cur.execute(
            """SELECT
                 COALESCE(SUM(CASE WHEN type='out' THEN amount ELSE 0 END), 0),
                 COALESCE(SUM(CASE WHEN type='in'  THEN amount ELSE 0 END), 0),
                 COALESCE(SUM(CASE WHEN type='out' AND date >= %s THEN amount ELSE 0 END), 0),
                 COALESCE(SUM(CASE WHEN type='in'  AND date >= %s THEN amount ELSE 0 END), 0),
                 COUNT(*)
               FROM transactions WHERE user_id = %s""",
            (month_start, month_start, user_id)
        )
        r = cur.fetchone()
        cur.close()
        conn.close()
        return jsonify({
            "total_spend":        float(r[0]),
            "total_cash_in":      float(r[1]),
            "month_out":          float(r[2]),
            "month_in":           float(r[3]),
            "net_balance":        round(float(r[1]) - float(r[0]), 2),
            "total_transactions": int(r[4])
        })
    except Exception as e:
        return db_error(e)

# ── Insights ─────────────────────────────────────────────────────────────────
@app.route("/api/insights/<int:user_id>", methods=["GET"])
def insights(user_id):
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute(
            """SELECT category, SUM(amount) as total
               FROM transactions WHERE user_id = %s AND type='out'
               GROUP BY category ORDER BY total DESC LIMIT 1""",
            (user_id,)
        )
        highest_cat = cur.fetchone()
        
        cur.execute(
            """SELECT SUM(amount) FROM transactions 
               WHERE user_id = %s AND type='out' AND date >= date_trunc('month', current_date)""",
            (user_id,)
        )
        month_out = cur.fetchone()[0] or 0
        
        cur.close()
        conn.close()
        
        highest_str = f"{highest_cat[0]} (₹{float(highest_cat[1]):.2f})" if highest_cat else "N/A"
        
        return jsonify({
            "highest_spending_category": highest_str,
            "financial_health": "Good" if float(month_out) < 2000 else "Needs Attention",
            "overspending_alert": float(month_out) > 3000,
            "recommendation": "Try to reduce dining expenses this month." if highest_cat and highest_cat[0] == "Food & Dining" else "Keep tracking your expenses!"
        })
    except Exception as e:
        return db_error(e)

# ── ML Prediction ────────────────────────────────────────────────────────────
@app.route("/api/predict/<int:user_id>", methods=["GET"])
def predict(user_id):
    try:
        result = predict_expense(user_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"prediction": 0, "trend": "stable", "trend_pct": 0,
                        "model_used": "none", "error": str(e)}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)