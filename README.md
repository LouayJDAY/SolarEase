# SolarEase

Web platform for managing solar panel installation projects.
Multi-tenant SaaS with three roles (Admin, Installer, Client), photovoltaic
sizing engine (PVGIS), AI-powered recommendations (RAG / Ollama) and PDF
report generation.

---

## Architecture

- **Frontend** -- React 18 + Vite 6 + Tailwind 4 (`SolarEase Web App Design (2)/`)
- **API Gateway** -- Spring Cloud Gateway, port 8080 (`backend/gateway-service`)
- **Identity Service** -- Spring Boot 3, JWT + OTP, port 8081 (`backend/identity-service`)
- **Project Service** -- Spring Boot 3, Flyway, WebSocket, port 8082 (`backend/project-service`)
- **Dimensioning Service** -- Spring Boot 3, PVGIS, Ollama, iText PDF, port 8083 (`backend/dimensioning-service`)
- **3 x PostgreSQL** -- one DB per microservice (`postgres-identity`, `postgres-project`, `postgres-dimensioning`)
- **Ollama** -- local LLM runtime for RAG-augmented recommendations
- **n8n** -- workflow automation (optional)

---

## Quick start (local)

```bash
# 1. Configure secrets
cp backend/.env.example backend/.env
# Edit backend/.env

# 2. Start the full stack
docker compose -f backend/docker-compose.yml up -d

# 3. Open
#   Frontend: http://localhost:5173
#   Gateway:  http://localhost:8080
```

Need observability? Start the optional stack:

```bash
docker compose \
  -f backend/docker-compose.yml \
  -f backend/observability/docker-compose.observability.yml \
  up -d
# Prometheus http://localhost:9090
# Grafana    http://localhost:3000  (admin / admin)
```

---

## DevOps

- **CI/CD** -- GitHub Actions (`.github/workflows/`) for the 4 backend services
- **Containers** -- Dockerfiles for the 4 backend services
- **Observability** -- Spring Actuator + Micrometer Prometheus + Grafana + Loki
- **IaC** -- Kubernetes manifests with Kustomize (`k8s/base` + `k8s/overlays/{dev,prod}`) for the backend
- **Quality** -- JaCoCo (backend), Trivy scans
- **Deployment** -- backend on **Azure VM** (Docker Compose, deploy via GitHub Actions SSH or manual) ; frontend on **Vercel** (`vercel.json`)

See [RUNBOOK.md](RUNBOOK.md) for operations procedures.

---

## Branching strategy

- `main` -- protected, production
- `develop` -- integration branch
- `feature/SOLAR-<id>-<slug>` -- short-lived feature branches merged into `develop` via PR

---

## License

Internal academic project (PFE). See report under `rapport/overleaf/`.
