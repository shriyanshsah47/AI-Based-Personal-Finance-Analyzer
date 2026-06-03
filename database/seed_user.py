import psycopg2
import random
from datetime import datetime, timedelta

def seed_specific_user(email):
    conn = psycopg2.connect(dbname='finance_db', user='postgres', password='Esah@201336', host='localhost')
    cur = conn.cursor()

    cur.execute("SELECT id FROM users WHERE email=%s", (email,))
    res = cur.fetchone()
    if not res:
        print(f"User {email} not found!")
        return

    user_id = res[0]
    
    # Optional: Clear their existing transactions if they have any
    cur.execute("DELETE FROM transactions WHERE user_id=%s", (user_id,))
    
    out_cats = ["Food & Dining", "Shopping", "Housing", "Transportation", "Utilities", "Entertainment"]
    start_date = datetime.now() - timedelta(days=180)
    count = 0
    
    for i in range(180):
        current_date = start_date + timedelta(days=i)
        
        if current_date.day == 1:
            cur.execute(
                "INSERT INTO transactions (user_id, type, amount, category, date, notes) VALUES (%s, 'in', %s, 'Salary', %s, 'Monthly salary')", 
                (user_id, random.randint(4000, 5000), current_date.strftime('%Y-%m-%d'))
            )
            count += 1
            
        num_expenses = random.randint(1, 3)
        for _ in range(num_expenses):
            cat = random.choice(out_cats)
            amt = round(random.uniform(10.0, 150.0), 2)
            if cat == "Housing" and current_date.day == 5:
                amt = random.randint(1000, 1500)
            elif cat == "Housing":
                continue
                
            cur.execute(
                "INSERT INTO transactions (user_id, type, amount, category, date, notes) VALUES (%s, 'out', %s, %s, %s, %s)", 
                (user_id, amt, cat, current_date.strftime('%Y-%m-%d'), f"Random {cat} expense")
            )
            count += 1
            
    conn.commit()
    print(f"Successfully seeded {count} transactions for {email} (User ID: {user_id})")
    cur.close()
    conn.close()

if __name__ == "__main__":
    seed_specific_user('shriyanshsah@gmail.com')
