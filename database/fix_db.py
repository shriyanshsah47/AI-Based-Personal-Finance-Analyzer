import psycopg2

def fix_db():
    conn = psycopg2.connect(
        host="localhost",
        database="finance_db",
        user="postgres",
        password="Esah@201336",
        port="5432"
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    sql = """
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS categories;

    CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(3) NOT NULL CHECK (type IN ('in', 'out')),
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE transactions (
        transaction_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(3) NOT NULL CHECK (type IN ('in', 'out')),
        amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
        category VARCHAR(100) NOT NULL,
        custom_category VARCHAR(100),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX idx_user_date ON transactions (user_id, date DESC);
    CREATE INDEX idx_type ON transactions (type);

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

    INSERT INTO users (name, email, password_hash) VALUES 
    ('Demo User', 'demo@finance.com', 'scrypt:32768:8:1$dummyhash$dummy') ON CONFLICT DO NOTHING;
    """
    
    cur.execute(sql)
    cur.close()
    conn.close()
    print("Database tables DROPPED and RECREATED successfully!")

if __name__ == "__main__":
    fix_db()
