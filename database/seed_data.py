import psycopg2
import random
from datetime import datetime, timedelta

def get_db():
    return psycopg2.connect(
        host="localhost",
        database="finance_db",
        user="postgres",
        password="Esah@201336",
        port="5432"
    )

def seed_transactions():
    conn = get_db()
    cur = conn.cursor()
    
    # Optional: Clear existing transactions to have a clean dataset
    cur.execute("DELETE FROM transactions")
    
    in_cats = ["Salary", "Freelance", "Investments"]
    out_cats = ["Food & Dining", "Shopping", "Housing", "Transportation", "Utilities", "Entertainment"]
    
    start_date = datetime.now() - timedelta(days=180) # Approx 6 months ago
    
    transactions_added = 0
    
    for i in range(180):
        current_date = start_date + timedelta(days=i)
        
        # Monthly salary on the 1st
        if current_date.day == 1:
            cur.execute("""
                INSERT INTO transactions (user_id, type, amount, category, date, notes)
                VALUES (1, 'in', %s, 'Salary', %s, 'Monthly salary')
            """, (random.randint(4000, 5000), current_date.strftime('%Y-%m-%d')))
            transactions_added += 1
            
        # Daily expenses (1-3 per day)
        num_expenses = random.randint(1, 3)
        for _ in range(num_expenses):
            cat = random.choice(out_cats)
            amt = round(random.uniform(10.0, 150.0), 2)
            
            # Make housing static high value once a month
            if cat == "Housing" and current_date.day == 5:
                amt = random.randint(1000, 1500)
            elif cat == "Housing":
                continue # Only one housing per month
                
            cur.execute("""
                INSERT INTO transactions (user_id, type, amount, category, date, notes)
                VALUES (1, 'out', %s, %s, %s, %s)
            """, (amt, cat, current_date.strftime('%Y-%m-%d'), f"Random {cat} expense"))
            transactions_added += 1
            
    conn.commit()
    cur.close()
    conn.close()
    print(f"Successfully seeded {transactions_added} random transactions spanning the last 6 months!")

if __name__ == "__main__":
    seed_transactions()
