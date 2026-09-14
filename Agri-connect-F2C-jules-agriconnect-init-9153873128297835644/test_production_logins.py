import json
import urllib.request
import urllib.error

RENDER_BASE_URL = "https://agriconnect-f2c.onrender.com"

def test_login(phone, password, role):
    url = f"{RENDER_BASE_URL}/api/login"
    payload = json.dumps({"phone": phone, "password": password, "role": role}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Origin": "https://agri-connect-f2c.web.app"
        },
        method="POST"
    )
    print(f"Testing {role} login for phone '{phone}'...")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"  Result ({resp.status}): SUCCESS -> user_id: {data.get('id') or data.get('user_id') or 'OK'}")
            return True, data
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        print(f"  Result ({e.code}): {body}")
        return False, body
    except Exception as e:
        print(f"  Error: {e}")
        return False, str(e)

if __name__ == "__main__":
    print("=== TESTING RENDER BACKEND LOGIN FLOWS FROM FIREBASE ORIGIN ===")
    test_login("9876543210", "password123", "farmer")
    test_login("9876543211", "password123", "consumer")
    test_login("9876543212", "password123", "delivery")
