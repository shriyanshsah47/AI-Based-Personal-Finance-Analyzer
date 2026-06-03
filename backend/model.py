import numpy as np
from datetime import datetime, date
from db import get_connection

def get_expense_data(user_id=1):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT amount, 
               CASE WHEN category = 'Other Transaction' THEN custom_category ELSE category END as cat, 
               date 
        FROM transactions 
        WHERE type='out' AND user_id=%s
        ORDER BY date ASC
    """, (user_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

def build_monthly_features(rows):
    monthly = {}
    cat_monthly = {}
    for amount, category, tx_date in rows:
        d = datetime.strptime(str(tx_date), "%Y-%m-%d") if isinstance(tx_date, str) else tx_date
        key = (d.year, d.month)
        
        # Global stats
        if key not in monthly:
            monthly[key] = {"total": 0, "count": 0, "days": set()}
        monthly[key]["total"] += float(amount)
        monthly[key]["count"] += 1
        monthly[key]["days"].add(d.day)
        
        # Category stats
        if key not in cat_monthly:
            cat_monthly[key] = {}
        cat_name = category if category else "Uncategorized"
        cat_monthly[key][cat_name] = cat_monthly[key].get(cat_name, 0) + float(amount)

    keys = sorted(monthly.keys())
    X, y = [], []
    for i, (yr, mo) in enumerate(keys):
        d = monthly[(yr, mo)]
        X.append([yr, mo, d["count"], len(d["days"]), i, mo % 4,
                  1 if mo in [1,2,12] else 0, 1 if mo in [6,7,8] else 0])
        y.append(d["total"])
    return np.array(X), np.array(y), keys, cat_monthly

def next_month_features(X):
    yr, mo = int(X[-1][0]), int(X[-1][1])
    nmo = mo % 12 + 1
    nyr = yr + (1 if mo == 12 else 0)
    ni  = int(X[-1][4]) + 1
    return np.array([[nyr, nmo, int(X[:,2].mean()), int(X[:,3].mean()),
                      ni, nmo % 4, 1 if nmo in [1,2,12] else 0, 1 if nmo in [6,7,8] else 0]])

def dynamic_extrapolation(current_month_total, current_month_days):
    if current_month_days == 0: return 0.0
    daily_avg = current_month_total / len(current_month_days)
    # Extrapolate to 30 days and add a 2% buffer for variance
    return daily_avg * 30 * 1.02

def predict_expense(user_id=1):
    rows = get_expense_data(user_id)
    if not rows:
        return {"prediction": 0, "trend": "stable", "trend_pct": 0,
                "model_used": "none", "monthly_avg": 0, "data_points": 0,
                "months_analyzed": 0, "message": "No expense data yet.",
                "predicted_categories": [], "current_top_categories": []}

    X, y, months, cat_monthly = build_monthly_features(rows)
    n = len(months)
    
    # Calculate current month top categories
    curr_yr, curr_mo = datetime.now().year, datetime.now().month
    current_key = (curr_yr, curr_mo)
    current_top = []
    if current_key in cat_monthly:
        sorted_cats = sorted(cat_monthly[current_key].items(), key=lambda item: item[1], reverse=True)
        current_top = [{"name": c[0], "amount": round(c[1], 2)} for c in sorted_cats[:3]]

    # ML Prediction for Total
    rf_pred = xgb_pred = None
    final_pred = 0.0
    model_name = "Dynamic Extrapolation (Insufficient Data)"

    if n >= 3:
        try:
            from sklearn.ensemble import RandomForestRegressor
            from sklearn.preprocessing import StandardScaler
            sc = StandardScaler()
            Xs = sc.fit_transform(X)
            m  = RandomForestRegressor(n_estimators=200, max_depth=6, random_state=42)
            m.fit(Xs, y)
            rf_pred = float(m.predict(sc.transform(next_month_features(X)))[0])
        except Exception: pass

        try:
            import xgboost as xgb
            m = xgb.XGBRegressor(n_estimators=300, max_depth=4, learning_rate=0.05, random_state=42, verbosity=0)
            m.fit(X, y)
            xgb_pred = float(m.predict(next_month_features(X))[0])
        except Exception: pass

    if xgb_pred is not None and rf_pred is not None:
        final_pred = xgb_pred*0.6 + rf_pred*0.4
        model_name = "Ensemble (XGBoost 60% + Random Forest 40%)"
    elif xgb_pred is not None:
        final_pred = xgb_pred; model_name = "XGBoost"
    elif rf_pred is not None:
        final_pred = rf_pred;  model_name = "Random Forest"
    else:
        # Fallback extrapolation
        last_key = months[-1]
        last_month_data = [d for d in rows if (isinstance(d[2], str) and d[2].startswith(f"{last_key[0]}-{str(last_key[1]).zfill(2)}")) or (not isinstance(d[2], str) and d[2].year == last_key[0] and d[2].month == last_key[1])]
        if last_month_data:
            days_active = set(datetime.strptime(str(d[2]), "%Y-%m-%d").day if isinstance(d[2], str) else d[2].day for d in last_month_data)
            final_pred = dynamic_extrapolation(y[-1], days_active)
        else:
            final_pred = y[-1]

    final_pred = max(0.0, final_pred)

    # Category prediction breakdown based on historical weights
    cat_weights = {}
    total_historical = sum(y)
    if total_historical > 0:
        for k, v in cat_monthly.items():
            for c_name, c_amt in v.items():
                cat_weights[c_name] = cat_weights.get(c_name, 0) + c_amt
        # Normalize weights
        cat_weights = {k: v/total_historical for k, v in cat_weights.items()}
    
    # Predict category amounts
    predicted_cats = [{"name": k, "amount": round(v * final_pred, 2)} for k, v in cat_weights.items()]
    predicted_cats = sorted(predicted_cats, key=lambda x: x["amount"], reverse=True)[:3]

    # Trend calculation
    trend_pct = 0.0; trend = "stable"
    if len(y) >= 1:
        last_month = y[-1]
        if last_month > 0:
            pct = ((final_pred - last_month) / last_month) * 100
            trend_pct = round(abs(pct), 1)
            trend = "increase" if pct > 5 else "decrease" if pct < -5 else "stable"

    return {
        "prediction": round(final_pred, 2), 
        "trend": trend, 
        "trend_pct": trend_pct,
        "model_used": model_name, 
        "monthly_avg": round(float(y.mean()), 2) if len(y) > 0 else 0,
        "data_points": len(rows), 
        "months_analyzed": n,
        "message": f"Analyzed {n} month(s) with daily velocity tracking.",
        "predicted_categories": predicted_cats,
        "current_top_categories": current_top
    }