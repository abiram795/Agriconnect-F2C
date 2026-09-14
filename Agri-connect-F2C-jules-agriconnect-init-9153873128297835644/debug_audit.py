import urllib.request
import json
import uuid
import sys

BASE_URL = "http://127.0.0.1:8001"

def api_request(method, path, data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"detail": err_body}
    except Exception as e:
        return 500, {"detail": str(e)}

def debug_audit():
    phone_suffix = str(uuid.uuid4().int)[:6]
    
    # 1. Create Farmer
    st, farmer = api_request("POST", "/api/users", {
        "name": f"Audit Farmer {phone_suffix}",
        "phone": f"9876{phone_suffix}",
        "role": "farmer",
        "state": "Tamil Nadu",
        "district": "Coimbatore",
        "village": "Pollachi",
        "farm_size": "5 acres"
    })
    print("1. Farmer creation:", st, farmer)

if __name__ == "__main__":
    debug_audit()
