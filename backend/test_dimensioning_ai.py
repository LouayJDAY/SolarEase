import json
import urllib.request

BASE = "http://localhost:8080"


def request(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


login = request(
    "POST",
    "/api/auth/login",
    {"email": "installer.test@solarease.com", "password": "Installer123!"},
)

token = login["accessToken"]
print("LOGIN_OK", login["user"]["uuid"])

equipment = request("GET", "/api/equipment", token=token)
print("EQUIPMENT_IDS", [(e["id"], e["type"], e["name"]) for e in equipment])

payload = {
    "projectId": 6,
    "area": 25.0,
    "inclination": 30.0,
    "orientation": "SOUTH",
    "latitude": 34.7406,
    "longitude": 10.7603,
    "roofType": "FLAT",
    "panelId": 1,
    "inverterId": 4,
}

result = request("POST", "/api/dimensioning/calculate", payload, token=token)
print("AI_RECOMMENDATION", result.get("aiRecommendation"))
