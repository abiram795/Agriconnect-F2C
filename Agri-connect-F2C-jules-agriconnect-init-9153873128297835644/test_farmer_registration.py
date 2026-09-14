import urllib.request
import urllib.error
import json
import random

RENDER_BASE_URL = "https://agriconnect-f2c.onrender.com"

def test_options_preflight():
    url = f"{RENDER_BASE_URL}/api/farmers/register"
    req = urllib.request.Request(
        url,
        headers={
            "Origin": "https://agri-connect-f2c.web.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"
        },
        method="OPTIONS"
    )
    print(f"Testing OPTIONS preflight to {url}...")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"OPTIONS Status: {resp.status}")
            print(f"Access-Control-Allow-Origin: {resp.headers.get('Access-Control-Allow-Origin')}")
            print(f"Access-Control-Allow-Methods: {resp.headers.get('Access-Control-Allow-Methods')}")
            print(f"Access-Control-Allow-Headers: {resp.headers.get('Access-Control-Allow-Headers')}")
    except urllib.error.HTTPError as e:
        print(f"OPTIONS HTTPError {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"OPTIONS Exception: {e}")

def test_farmer_register_new_phone():
    url = f"{RENDER_BASE_URL}/api/farmers/register"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    unique_phone = f"999{random.randint(1000000, 9999999)}"
    
    fields = {
        "name": "Test Farmer",
        "phone": unique_phone,
        "password": "Password123!",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "village": "testvillage",
        "farm_size": "Less than 2 acres",
        "languages": "Tamil",
        "land_area": "",
        "acreage": "",
        "ownership_status": "",
        "document_type": ""
    }
    
    body = []
    for key, val in fields.items():
        body.append(f"--{boundary}".encode("utf-8"))
        body.append(f'Content-Disposition: form-data; name="{key}"'.encode("utf-8"))
        body.append(b"")
        body.append(val.encode("utf-8"))
    body.append(f"--{boundary}--".encode("utf-8"))
    body.append(b"")
    
    payload = b"\r\n".join(body)
    
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Origin": "https://agri-connect-f2c.web.app"
        },
        method="POST"
    )
    
    print(f"\nSending POST to {url} with phone {unique_phone}...")
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode("utf-8")
            print(f"POST Status {resp.status}: {data}")
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8")
        print(f"POST HTTPError {e.code}: {body_text}")
    except Exception as e:
        print(f"POST Exception: {e}")

if __name__ == "__main__":
    test_options_preflight()
    test_farmer_register_new_phone()
