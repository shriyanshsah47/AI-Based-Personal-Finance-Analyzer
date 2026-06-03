-- Run this in psql or pgAdmin to set up your database

CREATE DATABASE finance_db;

\c finance_db;

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(3) NOT NULL CHECK (type IN ('in', 'out')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    security_pin VARCHAR(4) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
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
CREATE INDEX idx_type      ON transactions (type);

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
