import psycopg2

def drop_pin_column():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="finance_db",
            user="postgres",
            password="Esah@201336",
            port="5432"
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        cur.execute("ALTER TABLE users DROP COLUMN IF EXISTS security_pin;")
        print("Successfully dropped security_pin column from users table.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    drop_pin_column()
