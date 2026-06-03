# AI-Based Personal Finance Analyzer

A Full Stack AI-powered personal finance management web application built for my BCA final year major project. This application allows users to track their daily transactions, view detailed financial analytics on a premium dashboard, and get future expense predictions using Machine Learning (Random Forest Regressor).

## 📌 Features

- **Premium UI/UX:** Built with React and Material UI, featuring a sleek dark-mode fintech dashboard.
- **Transaction Management:** Add, delete, and view incomes and expenses easily.
- **Smart Analytics:** Real-time summary of net balance, total spending, and monthly cash flow.
- **Data Visualization:** Interactive pie charts and trend lines using Recharts.
- **AI Prediction:** Uses Scikit-Learn (Random Forest) to forecast next month's spending based on historical data.
- **Smart Insights:** Automated financial health checks and overspending alerts.

## 🛠️ Technology Stack

**Frontend:**
- React.js
- Material UI (MUI) v5
- Recharts (for Data Visualization)
- Axios

**Backend:**
- Python Flask
- Flask-CORS
- psycopg2

**Database:**
- PostgreSQL

**Machine Learning:**
- Python (Pandas, NumPy)
- Scikit-learn (RandomForestRegressor)

---

## 📂 Folder Structure

```text
finance-analyzer/
│
├── backend/                  # Python Flask API & ML Models
│   ├── app.py                # Main Flask application and API routes
│   ├── db.py                 # PostgreSQL connection utility
│   ├── model.py              # ML Logic (Random Forest & XGBoost)
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React.js Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable UI components (Dashboard Widgets)
│   │   ├── services/         # API calls (axios)
│   │   ├── theme/            # MUI Custom Dark Theme
│   │   ├── App.js            # Main Dashboard Layout
│   │   └── index.js          # React Entry Point
│   └── package.json          # Node dependencies
│
├── database/                 # Database Schema, Setup, & Seed Scripts
│   ├── schema.sql            # PostgreSQL schema SQL
│   ├── setup_db.py           # Database setup initialization script
│   ├── fix_db.py             # Reset & recreate database tables
│   ├── seed_data.py          # Generate random mock transactions
│   └── seed_user.py          # Generate mock transactions for a specific user
│
├── docs/                     # Documentation files
│   ├── database_setup.md     # Database tables and setup guide
│   └── viva_preparation.md   # Project architecture & Viva notes
│
├── README.md                 # Main project instructions
└── .gitignore                # Git ignore file (build, env, venv)
```

---

## 🚀 Setup Instructions

### 1. Database Setup (PostgreSQL)
1. Open **pgAdmin 4** or your PostgreSQL command line and ensure a database named `finance_db` exists.
2. Update your database credentials in `backend/db.py` if they differ from the defaults (`localhost`, `postgres`, your password).
3. Open a terminal at the project root and initialize the database schema and default categories by running:
   ```bash
   python database/fix_db.py
   ```
4. (Optional) To seed random historical transaction data for testing, run:
   ```bash
   python database/seed_data.py
   ```

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```bash
   python app.py
   ```
   *The API will run on `http://localhost:5000`.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the Node modules:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   *The app will automatically open in your browser at `http://localhost:3000`.*

---

## Architecture Notes & FAQs

- **Why Flask and not Express?** Flask is lightweight and seamlessly integrates with Python's powerful Machine Learning libraries (Scikit-learn, Pandas) which we use for expense prediction.
- **How does the ML work?** The app fetches historical `out` transactions, groups them by month, extracts features (like days in month, transaction count, season), and uses a `RandomForestRegressor` to predict the next month's total spend.
- **Why PostgreSQL?** It is a robust, ACID-compliant relational database perfect for financial transactions where data integrity is paramount.
- **UI Design:** The UI is designed using Material UI with a custom theme to replicate modern fintech applications (like CRED), employing glassmorphism, dark themes, and responsive grid layouts.
