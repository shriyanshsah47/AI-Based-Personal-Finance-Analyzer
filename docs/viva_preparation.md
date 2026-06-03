# 🎓 Viva Preparation & Project Architecture

This document contains key architectural details and commonly asked viva-voce questions for the **AI-Based Personal Finance Analyzer** project.

---

## 🏗️ System Architecture

The application is structured as a modern full-stack web application:

```text
┌─────────────────────────────────────────┐
│              React Frontend             │
│      (Material UI & Recharts Data)      │
└────────────────────┬────────────────────┘
                     │ REST API Requests
                     ▼
┌─────────────────────────────────────────┐
│               Flask Backend             │
│  (Python API, Security, CORS, Routing)  │
└────────────┬─────────────────────┬──────┘
             │                     │
             │ psycopg2            │ Scikit-Learn
             ▼                     ▼
┌────────────────────────┐   ┌────────────────────────┐
│   PostgreSQL Database  │   │  RandomForestRegressor │
│ (Transactions & Users) │   │   (ML Prediction Model)│
└────────────────────────┘   └────────────────────────┘
```

### 1. Frontend (React.js)
- **Role:** Handles the presentation layer, dashboard layout, charts rendering, and user interactions.
- **Key Libraries:**
  - **Material UI (MUI v5):** Implements a premium glassmorphic dark-theme UI.
  - **Recharts:** Renders responsive financial trend lines and category-wise spending charts.
  - **Axios:** Performs asynchronous HTTP requests to the backend.

### 2. Backend (Flask)
- **Role:** Implements the REST API endpoints, user authentication (hashing passwords, verifying sessions), and orchestrates data prediction.
- **Why Flask instead of Node.js/Express?**
  - Flask is a lightweight Python framework. Since our ML predictions (Random Forest Regressor, Pandas data manipulation) are written in Python, using Flask allows us to seamlessly integrate our ML logic in the same backend runtime without inter-process communication overhead.

### 3. Database (PostgreSQL)
- **Role:** Provides robust, transactional, ACID-compliant relational storage.
- **Tables:**
  - `users`: Tracks registration info (passwords hashed using `scrypt`).
  - `categories`: Contains income/expense categories (Salary, Food, Housing, etc.).
  - `transactions`: Stores ledger records (amount, type, category, date, user reference).

### 4. Machine Learning (Scikit-Learn)
- **Model:** `RandomForestRegressor`
- **Feature Engineering:**
  - Aggregates user's historical monthly transaction data.
  - Generates features: monthly spending history, current season, transaction counts.
  - Trains a Random Forest ensemble model to forecast the spending for the upcoming month.

---

## 💬 Frequently Asked Viva Questions

### Q1: Why did you choose PostgreSQL over MongoDB?
- **Answer:** Relational databases are highly suited for financial ledger applications. PostgreSQL guarantees strict ACID properties (Atomicity, Consistency, Isolation, Durability), ensuring that transactions are never lost or corrupted. MongoDB is document-based and better suited for unstructured content, whereas transactions naturally map to a structured relational schema with foreign key constraints (e.g., matching transactions to a specific `user_id`).

### Q2: How does the AI model predict expenses?
- **Answer:** 
  1. The backend fetches all past `out` (expense) transactions for the specific user.
  2. The data is grouped chronologically by month using Pandas.
  3. Features such as previous month expenses, moving averages, and month-of-year indexes are computed.
  4. A `RandomForestRegressor` model is initialized and trained on this dataset.
  5. The model outputs a prediction of the total expected spending for the next month, along with comparison insights (e.g., if spending is expected to increase or decrease).

### Q3: How is security handled in user login?
- **Answer:** We use Python's `werkzeug.security` module. Passwords are never stored in plain text. They are hashed using the secure `scrypt` hashing algorithm before being saved in the `users` table. During login, the entered password is compiled and compared against the stored hash using `check_password_hash`. Additionally, a 4-digit security PIN is used for secure password resets.
