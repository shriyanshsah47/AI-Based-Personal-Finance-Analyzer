import urllib.request
import json

BASE = "http://localhost:5000/api"

def run_test():
    # 1. Register a new user
    reg_url = f"{BASE}/auth/register"
    reg_data = {
        "name": "Single Tx User",
        "email": "singletx@gmail.com",
        "password": "abc",
        "security_pin": "5678"
    }
    
    print("1. Registering new user...")
    try:
        req = urllib.request.Request(
            reg_url, 
            data=json.dumps(reg_data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req) as res:
            reg_res = json.loads(res.read().decode())
            print(f"Registration Success: {reg_res}\n")
            new_user_id = reg_res["user_id"]
    except Exception as e:
        print(f"Registration Failed: {e}\n")
        new_user_id = None

    # 2. Login as the new user
    login_url = f"{BASE}/auth/login"
    login_data = {
        "email": "singletx@gmail.com",
        "password": "abc"
    }
    print("2. Logging in...")
    try:
        req = urllib.request.Request(
            login_url, 
            data=json.dumps(login_data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req) as res:
            login_res = json.loads(res.read().decode())
            print(f"Login Success: {login_res}\n")
            if not new_user_id:
                new_user_id = login_res["user"]["id"]
    except Exception as e:
        print(f"Login Failed: {e}\n")
        return

    # 3. Add exactly ONE expense transaction
    add_url = f"{BASE}/transactions"
    tx_data = {
        "amount": 150.00,
        "category": "Food & Dining",
        "type": "out",
        "date": "2026-06-02",
        "notes": "Test first expense",
        "user_id": new_user_id
    }
    print("3. Adding one expense transaction...")
    try:
        req = urllib.request.Request(
            add_url,
            data=json.dumps(tx_data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req) as res:
            add_res = json.loads(res.read().decode())
            print(f"Add Success: {add_res}\n")
    except Exception as e:
        print(f"Add Failed: {e}\n")
        return

    # 4. Fetch dashboard data for the user
    endpoints = [
        f"/transactions/{new_user_id}",
        f"/summary/{new_user_id}",
        f"/insights/{new_user_id}",
        f"/predict/{new_user_id}",
        "/categories"
    ]
    
    print("4. Fetching dashboard endpoints...")
    for ep in endpoints:
        url = f"{BASE}{ep}"
        print(f"Fetching {url}...")
        try:
            with urllib.request.urlopen(url) as res:
                data = json.loads(res.read().decode())
                print(f"SUCCESS: {data}\n")
        except Exception as e:
            print(f"FAILED: {e}\n")

if __name__ == '__main__':
    run_test()
