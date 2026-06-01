# SolarEase -- Operations Runbook

Operational procedures for running, deploying, and recovering the SolarEase
platform across local, Docker Compose, Azure VM, and Kubernetes environments.

> Audience: developers and ops on call. Keep this document up to date when
> infrastructure changes.

---

## 1. Environments

| Environment | Purpose | URL | Source branch |
|-------------|---------|-----|----------------|
| Local | Developer laptop | http://localhost:5173 | any |
| Production | Live demo (PFE) | Vercel + Azure VM gateway :8080 | `main` |

---

## 2. Branching strategy (GitFlow)

```
main          o---o---o---o (production, Azure + Vercel)
                       \      /
develop       --o---o---o---o---o ...                       -> integration
                  \     /
feature/X         o---o
```

Rules:

- `main` is **protected**. Require: PR + green CI + 1 reviewer approval. No direct push, no force push.
- `develop` is the integration branch.
- `feature/SOLAR-<id>-<slug>` branches are created from `develop` and merged via PR.
- Push to `main` (backend changes) triggers Azure deploy via GitHub Actions.

GitHub branch protection: configure via repo settings -> Branches -> Protect matching branches.

---

## 3. Local development

```bash
# 1. Copy the env template
cp backend/.env.example backend/.env
# Edit backend/.env and fill in real values

# 2. Start everything
docker compose -f backend/docker-compose.yml up -d

# 3. (Optional) start observability stack
docker compose \
  -f backend/docker-compose.yml \
  -f backend/observability/docker-compose.observability.yml \
  up -d

# 4. Open
#   Frontend         http://localhost:5173
#   Gateway          http://localhost:8080
#   Prometheus       http://localhost:9090
#   Grafana          http://localhost:3000   (admin / admin by default)
```

---

## 4. CI / CD overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `backend-ci.yml` | push / PR on `backend/**` | mvn verify on the 4 services (matrix) |
| `docker-publish.yml` | push to `main`, tags `v*` | build + push images to GHCR |
| `security-scan.yml` | push, PR, weekly cron | Trivy (fs + images) + Gitleaks |
| `deploy.yml` | push to `main` (`backend/**`), manual | SSH deploy to Azure VM |

Required GitHub secrets:

- `AZURE_VM_HOST` -- public IP of the Azure VM (e.g. `4.233.29.236`)
- `AZURE_VM_USER` -- SSH user (e.g. `azureuser`)
- `AZURE_VM_SSH_KEY` -- private ED25519 key for SSH deploy

Required GitHub variables:

- `PRODUCTION_URL` -- public frontend URL (Vercel) for the Actions UI

---

## 5. Common operations

### 5.1. Deploy to Azure manually (SSH)

```bash
ssh azureuser@<AZURE_VM_IP>
cd ~/SolarEase
git pull origin main
cd backend
docker compose up -d --build
curl http://localhost:8080/actuator/health
```

### 5.2. Deploy via GitHub Actions

```bash
gh workflow run deploy.yml
# Or push backend changes to main (auto-trigger).
```

### 5.3. Cut a production release

```bash
git checkout main
git pull --ff-only
git merge --no-ff develop
git push origin main
# backend: deploy.yml runs if backend/** changed
# frontend: Vercel redeploys automatically
```

### 5.4. Rollback an Azure deployment

```bash
ssh azureuser@<AZURE_VM_IP>
cd ~/SolarEase
git log --oneline -5          # find the previous good commit
git checkout <commit-sha>
cd backend
docker compose up -d --build
curl http://localhost:8080/actuator/health
```

### 5.5. Apply Kubernetes manifests

```bash
# dev overlay
kubectl apply -k k8s/overlays/dev

# prod overlay
kubectl apply -k k8s/overlays/prod
```

### 5.6. Create / rotate Kubernetes secrets

Do **not** commit real values. Use sealed-secrets or `kubectl create secret`:

```bash
kubectl -n solarease create secret generic solarease-secrets \
  --from-literal=POSTGRES_PASSWORD='...' \
  --from-literal=APP_JWT_SECRET='...' \
  --from-literal=JWT_SECRET='...' \
  --from-literal=SPRING_MAIL_USERNAME='...' \
  --from-literal=SPRING_MAIL_PASSWORD='...' \
  --dry-run=client -o yaml | kubectl apply -f -
```

To rotate the JWT secret in production: update the secret, then trigger a
rolling restart of `identity-service` and `gateway-service`:

```bash
kubectl -n solarease rollout restart deployment/identity-service deployment/gateway-service
```

> All active user sessions will be invalidated.

### 5.7. Backup / restore PostgreSQL (Kubernetes)

```bash
# Backup
kubectl -n solarease exec -i postgres-project-0 -- \
  pg_dump -U postgres solarease_projects > backup-project-$(date +%F).sql

# Restore (after recreating the DB if needed)
kubectl -n solarease exec -i postgres-project-0 -- \
  psql -U postgres -d solarease_projects < backup-project-2026-05-22.sql
```

### 5.8. Restart Ollama (RAG sometimes hangs on first model load)

```bash
docker compose -f backend/docker-compose.yml restart ollama
# or in Kubernetes
kubectl -n solarease rollout restart deployment/ollama
```

### 5.9. Watch service logs

```bash
# Docker compose
docker compose -f backend/docker-compose.yml logs -f gateway-service

# Kubernetes
kubectl -n solarease logs -f deployment/gateway-service --tail=200
```

---

## 6. Incident response

### Service is down (5xx errors)

1. Check `up{job=~".*-service"}` panel in Grafana.
2. Inspect logs in the Loki "SolarEase" dashboard for ERROR / WARN lines.
3. Look at `/actuator/health` of the gateway: `curl https://<gateway>/actuator/health`.
4. Check Postgres pod / container is `Running` / `Ready`.
5. If healthy but failing: rollback to the previous release (section 5.3).

### High p95 latency

1. In Grafana, identify the slow service from "HTTP latency (p95)".
2. Check JVM heap panel -- if heap is near limit, scale up replicas or memory.
3. Inspect database load (`pg_stat_activity`) for slow queries.

### Secret leak

1. Rotate the impacted secret immediately (section 5.5).
2. Revoke any compromised tokens (Azure SSH key, GHCR, mail provider).
3. Run `gitleaks detect --source .` locally to scan history.
4. If secret was committed: rewrite history with `git filter-repo`, force-push,
   and notify all collaborators to re-clone.

---

## 7. Useful URLs (local)

- Frontend: http://localhost:5173
- Gateway: http://localhost:8080
- Swagger (identity): http://localhost:8081/swagger-ui.html
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Loki API: http://localhost:3100
