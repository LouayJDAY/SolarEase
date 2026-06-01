# SolarEase -- Operations Runbook

Operational procedures for running, deploying, and recovering the SolarEase
platform across local, Docker Compose, Railway, and Kubernetes environments.

> Audience: developers and ops on call. Keep this document up to date when
> infrastructure changes.

---

## 1. Environments

| Environment | Purpose | URL | Source branch |
|-------------|---------|-----|----------------|
| Local | Developer laptop | http://localhost:5173 | any |
| Staging | Pre-production validation | (Railway) | `develop` |
| Production | Live customers | (Railway) | tags `v*.*.*` on `main` |

---

## 2. Branching strategy (GitFlow)

```
main          o---o---o---o (tagged v1.0.0, v1.1.0, ...)   -> production
                       \      /
develop       --o---o---o---o---o ...                       -> staging
                  \     /
feature/X         o---o
```

Rules:

- `main` is **protected**. Require: PR + green CI + 1 reviewer approval. No direct push, no force push.
- `develop` is the integration branch. Auto-deploys to staging.
- `feature/SOLAR-<id>-<slug>` branches are created from `develop` and merged via PR.
- Tags `v*.*.*` on `main` trigger production deploy + GitHub Release.

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
| `deploy.yml` | push to `develop` (staging), tag `v*` (prod) | Railway CLI deploy |

Required GitHub secrets:

- `RAILWAY_TOKEN` -- staging account token
- `RAILWAY_PROD_TOKEN` -- production account token
- `CODECOV_TOKEN` -- optional, for coverage upload

Required GitHub variables:

- `STAGING_URL`, `PRODUCTION_URL` -- environment URLs for the Actions UI

---

## 5. Common operations

### 5.1. Deploy to staging manually

```bash
gh workflow run deploy.yml -f environment=staging
```

### 5.2. Cut a production release

```bash
git checkout main
git pull --ff-only
git merge --no-ff develop
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin main --tags
# Pipeline `deploy.yml` runs automatically on the tag.
```

### 5.3. Rollback a Railway deployment

```bash
railway login
railway link <project-id>
railway environment production
railway service <service-name>
railway deployments    # find the previous deployment id
railway redeploy <deployment-id>
```

### 5.4. Apply Kubernetes manifests

```bash
# dev overlay
kubectl apply -k k8s/overlays/dev

# prod overlay
kubectl apply -k k8s/overlays/prod
```

### 5.5. Create / rotate Kubernetes secrets

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

### 5.6. Backup / restore PostgreSQL (Kubernetes)

```bash
# Backup
kubectl -n solarease exec -i postgres-project-0 -- \
  pg_dump -U postgres solarease_projects > backup-project-$(date +%F).sql

# Restore (after recreating the DB if needed)
kubectl -n solarease exec -i postgres-project-0 -- \
  psql -U postgres -d solarease_projects < backup-project-2026-05-22.sql
```

### 5.7. Restart Ollama (RAG sometimes hangs on first model load)

```bash
docker compose -f backend/docker-compose.yml restart ollama
# or in Kubernetes
kubectl -n solarease rollout restart deployment/ollama
```

### 5.8. Watch service logs

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
2. Revoke any compromised tokens (Railway, GHCR, mail provider).
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
