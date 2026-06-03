import psycopg2

def setup():
    conn = psycopg2.connect(
        host="localhost",
        database="finance_db",
        user="postgres",
        password="Esah@201336",
        port="5432"
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    # We skip CREATE DATABASE because we are already connected to finance_db
    # Also skip \c finance_db;
    
    sql = """
    CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(3) NOT NULL CHECK (type IN ('in', 'out')),
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
        transaction_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL DEFAULT 1,
        type VARCHAR(3) NOT NULL CHECK (type IN ('in', 'out')),
        amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
        category VARCHAR(100) NOT NULL,
        custom_category VARCHAR(100),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_user_date ON transactions (user_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_type ON transactions (type);

    -- Insert some default categories
    INSERT INTO categories (name, type) VALUES 
    ('Salary', 'in'),
    ('Freelance', 'in'),
    ('Investments', 'in'),
    ('Food & Dining', 'out'),
    ('Shopping', 'out'),
    ('Housing', 'out'),
    ('Transportation', 'out'),
    ('Utilities', 'out'),
    ('Entertainment', 'out'),
    ('Other Transaction', 'out'),
    ('Other Transaction', 'in') ON CONFLICT DO NOTHING;
    """
    
    cur.execute(sql)
    cur.close()
    conn.close()
    print("Database tables and categories created successfully!")

if __name__ == "__main__":
    setup()
