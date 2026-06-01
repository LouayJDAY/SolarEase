#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:8080"
# Même mot de passe que les comptes créés par SOLAREASE_DEMO_SEED (identity-service)
LOGIN_PAYLOAD='{"email":"installer.test@solarease.com","password":"SolarEase123!"}'

TOKEN=$(curl -s "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "$LOGIN_PAYLOAD" | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

CLIENT1=$(curl -s "$BASE_URL/api/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Ali","lastName":"Ben Ali","email":"ali.benali.3@test.com","phoneNumber":"+21622000111","address":"Tunis, Ariana"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')

CLIENT2=$(curl -s "$BASE_URL/api/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Sofia","lastName":"Trabelsi","email":"sofia.trabelsi.3@test.com","phoneNumber":"+21622000222","address":"Sfax, Route Menzel Chaker"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')

echo "LOGIN_OK"
echo "CLIENT1=$CLIENT1"
echo "CLIENT2=$CLIENT2"

curl -s "$BASE_URL/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Villa Ben Ali 6kW\",\"description\":\"Projet résidentiel test\",\"location\":\"Tunis\",\"latitude\":36.8065,\"longitude\":10.1815,\"peakPower\":6.0,\"availableArea\":35.0,\"inclination\":25.0,\"orientation\":180.0,\"budget\":12000,\"clientId\":$CLIENT1}" \
  | python3 -c 'import sys,json; o=json.load(sys.stdin); print("PROJECT1=%s" % o["id"])'

curl -s "$BASE_URL/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Toiture Trabelsi 9kW\",\"description\":\"Projet test avec batterie\",\"location\":\"Sfax\",\"latitude\":34.7406,\"longitude\":10.7603,\"peakPower\":9.0,\"availableArea\":52.0,\"inclination\":22.0,\"orientation\":170.0,\"budget\":18000,\"clientId\":$CLIENT2}" \
  | python3 -c 'import sys,json; o=json.load(sys.stdin); print("PROJECT2=%s" % o["id"])'
