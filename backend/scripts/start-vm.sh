#!/usr/bin/env bash
# SolarEase — démarrage backend sur VM Azure
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Erreur: backend/.env manquant. Copiez .env.example puis éditez-le."
  exit 1
fi

echo "==> Pull dernière version..."
git -C "$(dirname "$ROOT")" pull --ff-only origin main || true

echo "==> Docker Compose up..."
docker compose up -d --build

echo "==> Attente démarrage (90s max)..."
for i in $(seq 1 18); do
  if curl -sf http://localhost:8080/api/auth/login -X OPTIONS >/dev/null 2>&1; then
    echo "Gateway OK"
    break
  fi
  sleep 5
done

echo "==> Ollama (modèle tinyllama)..."
docker exec ollama ollama pull tinyllama:latest 2>/dev/null || echo "(ollama pull ignoré si déjà présent)"

echo ""
echo "==> Statut conteneurs"
docker compose ps

echo ""
echo "==> Test health"
curl -sf http://localhost:8080/actuator/health 2>/dev/null | head -c 200 || echo "Health: en cours..."

echo ""
echo "Terminé. Gateway public: http://$(curl -s ifconfig.me 2>/dev/null || echo '<IP_VM>'):8080"
