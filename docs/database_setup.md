# 🗄️ Database Setup & Schema Design

This document details the PostgreSQL schema design and execution instructions for setting up and seeding the database.

---

## 📋 Schema Details

The application uses three main tables: `users`, `categories`, and `transactions`.

### 1. `users` Table
Stores user registration details and secure credentials.
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    security_pin VARCHAR(4) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. `categories` Table
Contains transaction classification categories.
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(3) NOT NULL CHECK (type IN ('in', 'out')),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. `transactions` Table
Stores financial ledger records matching a user.
```sql
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
```

### ⚡ Performance Indices
To optimize queries for analytics and dashboard listing:
- `idx_user_date` on `transactions(user_id, date DESC)`: Speeds up dashboard data retrieval.
- `idx_type` on `transactions(type)`: Speeds up queries separating cash flow ('in' vs 'out').

---

## 🚀 Setup & Seeding Instructions

The database setup scripts have been organized inside the `database/` folder at the project root.

### 1. Prerequisite
Ensure you have **PostgreSQL** installed and running on your system. By default, the connection configurations look for a local instance (`localhost:5432`) with user `postgres` and password `Esah@201336`. If your settings differ, edit the credentials in `backend/db.py`.

### 2. Initialize Database Tables
To automatically drop any old tables, recreate the schema, and insert the default categories, run `fix_db.py` from the root directory:
```bash
python database/fix_db.py
```
*(Make sure psycopg2 is installed in your python environment).*

### 3. Seed Mock Transactions
To generate a comprehensive set of historical transaction records for test purposes (approx. 180 days of mock data), run:
- **Seed Random Data:**
  ```bash
  python database/seed_data.py
  ```
- **Seed Specific User Data:**
  To seed data for a specific user email (default: `shriyanshsah@gmail.com`), run:
  ```bash
  python database/seed_user.py
  ```
