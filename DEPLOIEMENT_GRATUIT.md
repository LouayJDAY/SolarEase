# 🚀 Guide de Déploiement Gratuit - SolarEase

## Vue d'ensemble des Options de Déploiement Gratuit

### Architecture Recommandée

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  Déployer sur: Vercel / Netlify / GitHub Pages          │
│  Coût: GRATUIT (avec limites)                           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Backend (Microservices Java)               │
│  Déployer sur: Render / Railway / Koyeb                 │
│  Coût: GRATUIT (avec limites)                           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│            Database PostgreSQL                           │
│  Déployer sur: Neon / Supabase / Railway               │
│  Coût: GRATUIT (avec limites)                           │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Frontend React - Options de Déploiement Gratuit

### 🥇 Option 1: **Vercel** (RECOMMANDÉ)
**Gratuit** • Déploiement automatique • Performances excellentes

#### Avantages:
- ✅ Déploiement automatique via Git
- ✅ HTTPS gratuit
- ✅ CDN global
- ✅ Vite compatible
- ✅ 100 déploiements/mois gratuit
- ✅ Support TypeScript natif

#### Étapes de déploiement:
```bash
# 1. Créer un compte sur vercel.com
# 2. Connecter votre repository GitHub
# 3. Configuration automatique pour Vite
# 4. Ajouter variables d'environnement
```

#### Configuration Environment:
```env
VITE_API_URL=https://votre-backend.com/api
VITE_ENV=production
```

#### Package.json (vérifier):
```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite"
  }
}
```

---

### 🥈 Option 2: **Netlify**
**Gratuit** • Simple • Excellente intégration Git

#### Avantages:
- ✅ Déploiement automatique
- ✅ HTTPS gratuit
- ✅ 100 GB bande passante/mois gratuit
- ✅ Fonctions serverless (limité)
- ✅ Redirects et rewrite natifs

#### Étapes:
```bash
# 1. npm run build (crée dist/)
# 2. Se connecter sur netlify.com
# 3. Drag & drop le dossier dist/ OU connecter GitHub
# 4. Configurer les redirects pour React Router
```

#### Configuration netlify.toml:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### 🥉 Option 3: **GitHub Pages**
**100% Gratuit** • Mais plus limité

⚠️ **Limitations**: Pas de support pour les fonctions serverless

---

## 2. Backend (Microservices Java) - Options Gratuit

### 🥇 Option 1: **Render** (RECOMMANDÉ)
**Gratuit avec limites** • Arrêt automatique après 15 min d'inactivité

#### Avantages:
- ✅ Support Docker natif
- ✅ PostgreSQL gratuit
- ✅ HTTPS automatique
- ✅ Déploiement via Git
- ✅ 750 heures/mois gratuit

#### Configuration:
```bash
# 1. Créer compte sur render.com
# 2. Créer 4 services (gateway, identity, dimensioning, project)
# 3. Chaque service = Dockerfile
```

#### Dockerfile pour un service Java:
```dockerfile
FROM eclipse-temurin:17-jdk-jammy as builder
WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y maven
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-Xmx512m", "-jar", "app.jar"]
```

#### Configuration Environment (Render):
```env
SPRING_DATASOURCE_URL=postgresql://user:password@db.example.com:5432/solarease
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
SPRING_JPA_HIBERNATE_DDL_AUTO=update
JAVA_OPTS=-Xmx512m
```

#### Limitations:
- ⚠️ Instance arrêtée après 15 min d'inactivité (gratuit)
- ⚠️ Démarrage lent (cold start)
- ⚠️ 512MB RAM max

---

### 🥈 Option 2: **Railway**
**Gratuit avec crédit** • $5/mois de crédit gratuit

#### Avantages:
- ✅ Support Docker excellent
- ✅ PostgreSQL inclus
- ✅ HTTPS automatique
- ✅ Pas d'arrêt après inactivité
- ✅ Interface intuitive

#### Étapes:
```bash
# 1. Se connecter sur railway.app
# 2. Créer nouveau projet
# 3. Connecter GitHub repo
# 4. Railway détecte Dockerfile automatiquement
```

#### Alternative sans Dockerfile (optimisé):
```yaml
# railway.toml
[build]
  builder = "dockerfile"

[deploy]
  startCommand = "java -jar target/app.jar"
```

---

### 🥉 Option 3: **Koyeb**
**Gratuit** • Serverless container • Pas d'arrêt

#### Avantages:
- ✅ Pas d'arrêt après inactivité
- ✅ Docker support
- ✅ HTTPS gratuit
- ✅ Geographic autoscaling

---

## 3. Base de Données PostgreSQL - Options Gratuit

### 🥇 Option 1: **Neon** (RECOMMANDÉ)
**Gratuit** • PostgreSQL serverless

#### Avantages:
- ✅ 3 branches gratuites
- ✅ 0.5 projects
- ✅ Compute hours limités mais suffisants
- ✅ Autoscaling
- ✅ Interface moderne

#### Configuration:
```bash
# 1. Créer compte sur neon.tech
# 2. Créer nouveau project
# 3. Obtenir connection string:
postgresql://user:password@ep-xxx.neon.tech/solarease?sslmode=require
```

#### Spring Boot Configuration:
```properties
spring.datasource.url=postgresql://user:password@ep-xxx.neon.tech/solarease?sslmode=require
spring.datasource.username=user
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

---

### 🥈 Option 2: **Supabase**
**Gratuit** • PostgreSQL + Auth + Storage

#### Avantages:
- ✅ PostgreSQL + Auth intégré
- ✅ Real-time capabilities
- ✅ Storage gratuit (1GB)
- ✅ API auto-générée

#### Configuration:
```
Connection string: postgresql://postgres:[PASSWORD]@db.supabase.co:5432/postgres
```

---

### 🥉 Option 3: **Railway**
Inclut PostgreSQL gratuit avec votre plan

```
5 projets gratuits
1 GB stockage BD
```

---

## 4. 📊 Tableau Comparatif - Déploiement Gratuit

| Service | Frontend | Backend | BD | SSL | CDN | Support | Limite |
|---------|----------|---------|-----|-----|-----|---------|--------|
| **Vercel** | ✅✅ | ❌ | ❌ | ✅ | ✅✅ | Email | - |
| **Netlify** | ✅✅ | ❌ | ❌ | ✅ | ✅ | Email | 100GB/mois |
| **Render** | ✅ | ✅ (600h/mois) | ✅ (90 jours) | ✅ | ⚠️ | Email | Cold start |
| **Railway** | ✅ | ✅ ($5/mois) | ✅ | ✅ | ⚠️ | Chat | Crédit |
| **Koyeb** | ✅ | ✅ | ❌ | ✅ | ✅ | Chat | - |
| **Neon** | ❌ | ❌ | ✅✅ | ✅ | ❌ | Chat | Compute |

---

## 5. 🎯 Configuration Complète Recommandée

### Meilleure combinaison gratuite:

```
FRONTEND:        Vercel (100% gratuit)
BACKEND:         Railway (gratuit + $5/mois crédit)
DATABASE:        Neon PostgreSQL (gratuit)
```

**Coût total: 0€ (avec crédit Railway)**

---

## 6. 🔧 Architecture Complète en Détail

### 6.1 Préparation du Projet

```bash
# 1. Vérifier la structure du projet
ls -la

# 2. Créer .dockerignore pour chaque service
# Backend/
cat > .dockerignore << EOF
node_modules
target
.git
.gitignore
.DS_Store
README.md
EOF

# 3. Créer docker-compose local pour test
docker-compose up -d
```

### 6.2 Frontend - Déploiement Vercel

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Déployer depuis le dossier frontend
cd "SolarEase Web App Design (2)"
vercel --prod

# 4. Ajouter variables d'environnement
# .env.production
VITE_API_URL=https://votre-backend-api.com/api
```

### 6.3 Backend - Configuration Render

#### Pour Gateway Service:

```yaml
# render.yaml (à la racine du repo)
services:
  - type: web
    name: gateway-service
    env: docker
    dockerfilePath: ./gateway-service/Dockerfile
    plan: free
    healthCheckPath: /actuator/health
    envVars:
      - key: SPRING_DATASOURCE_URL
        value: postgresql://user:pass@neon-host:5432/solarease
      - key: SPRING_JPA_HIBERNATE_DDL_AUTO
        value: validate
    
  - type: web
    name: identity-service
    env: docker
    dockerfilePath: ./identity-service/Dockerfile
    plan: free
    
  - type: web
    name: dimensioning-service
    env: docker
    dockerfilePath: ./dimensioning-service/Dockerfile
    plan: free
    
  - type: web
    name: project-service
    env: docker
    dockerfilePath: ./project-service/Dockerfile
    plan: free

databases:
  - name: solarease-db
    provider: postgresql
    plan: free
```

### 6.4 Application.properties Optimisé

```properties
# application-production.properties

# Server
server.port=8080
server.servlet.context-path=/api

# DataSource
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.hikari.maximum-pool-size=5
spring.datasource.hikari.minimum-idle=1

# JPA/Hibernate
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.jdbc.batch_size=20
spring.jpa.properties.hibernate.order_inserts=true

# Logging
logging.level.root=WARN
logging.level.com.solarease=INFO

# Jackson
spring.jackson.default-property-inclusion=non_null

# Security
spring.security.jwt.secret=${JWT_SECRET}
spring.security.jwt.expiration=3600000
```

---

## 7. 📝 Procédure Étape par Étape

### Phase 1: Préparation (30 min)

```bash
# 1. Cloner/préparer le code
git clone votre-repo
cd projetPfe

# 2. Créer Dockerfiles pour chaque service (s'ils n'existent pas)
for service in gateway-service identity-service dimensioning-service project-service
do
  cat > $service/Dockerfile << 'EOF'
FROM eclipse-temurin:17-jdk-jammy as builder
WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y maven
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx512m", "-jar", "app.jar"]
EOF
done

# 3. Créer .dockerignore
cat > .dockerignore << EOF
node_modules
target
.git
.DS_Store
*.md
EOF
```

### Phase 2: Déploiement BD (15 min)

```bash
# 1. Créer compte Neon.tech
# 2. Créer nouveau projet
# 3. Copier la connection string
# Exemple: postgresql://user:pass@ep-xxx.neon.tech/db

# 4. Initialiser la BD
psql postgresql://user:pass@ep-xxx.neon.tech/db < init.sql/schema.sql
```

### Phase 3: Déploiement Backend (45 min)

```bash
# 1. Créer compte Railway.app
# 2. Créer nouveau projet
# 3. Connecter GitHub repository
# 4. Railway détecte Dockerfile automatiquement
# 5. Ajouter variables d'environnement:
#    - DB_URL
#    - DB_USERNAME
#    - DB_PASSWORD
#    - JWT_SECRET

# 6. Déploiement automatique via Git push
git push origin main
```

### Phase 4: Déploiement Frontend (15 min)

```bash
# 1. Créer compte Vercel.com
# 2. Importer repository GitHub
# 3. Vercel configure automatiquement
# 4. Ajouter variables d'environnement:
#    VITE_API_URL=https://gateway-service-railway-url.com/api

# 5. Déploiement automatique via Git push
git push origin main
```

---

## 8. 🔐 Variables d'Environnement Critiques

### Frontend (.env.production)
```env
VITE_API_URL=https://votre-backend-api.com/api
VITE_ENV=production
VITE_LOG_LEVEL=error
```

### Backend (Render/Railway Dashboard)
```env
# Database
SPRING_DATASOURCE_URL=postgresql://user:pass@neon-host/db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=***
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars

# Server
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=production

# Logging
LOGGING_LEVEL_ROOT=WARN
LOGGING_LEVEL_COM_SOLAREASE=INFO
```

---

## 9. 🧪 Tests Post-Déploiement

```bash
# 1. Tester la BD
psql postgresql://user:pass@ep-xxx.neon.tech/db -c "SELECT version();"

# 2. Tester Gateway Service
curl https://gateway-service-url.com/api/actuator/health

# 3. Tester Identity Service
curl -X POST https://gateway-service-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# 4. Tester Frontend
# Ouvrir dans le navigateur: https://votre-app.vercel.app
```

---

## 10. ⚠️ Limitations et Solutions

| Limitation | Problème | Solution |
|-----------|----------|----------|
| Cold start | Backend s'arrête après 15 min | Utiliser Railway au lieu de Render |
| RAM limité | 512MB max sur Render | Optimiser Spring Boot / Utiliser Railway |
| Compute hours | Limité sur Neon | Garder les requêtes optimisées |
| Bande passante | Limitée sur Netlify | Utiliser Vercel + compression |
| Uptime | Pas garanti gratuit | Passer en payant si critique |

---

## 11. 💰 Coûts Estimés (avec payant optionnel)

### 100% Gratuit:
- Vercel Frontend: **0€**
- Railway Backend: **0€** (avec $5 crédit)
- Neon BD: **0€**
- **TOTAL: 0€/mois**

### Recommandé (Production Light):
- Vercel Pro: **20€/mois** (limite augmentée)
- Railway Pro: **5-15€/mois** (after credit)
- Neon Pro: **10€/mois** (compute power)
- **TOTAL: 35-45€/mois**

### Production Complète:
- Vercel Pro: **20€/mois**
- AWS/GCP Backend: **50-100€/mois**
- AWS RDS: **30-50€/mois**
- **TOTAL: 100-170€/mois**

---

## 12. 📞 Support et Monitoring

### Monitoring Gratuit:
- Vercel Analytics: Gratuit
- Railway Logs: Gratuit
- Neon Insights: Gratuit
- Sentry Error Tracking: Gratuit (limité)

### Commandes Utiles:

```bash
# Voir les logs Railway
railway logs

# Voir les logs Render
curl https://api.render.com/v1/services/{id}/logs

# Monitorer les erreurs
# https://sentry.io (compte gratuit)
```

---

## 13. 🎓 Prochaines Étapes

1. ✅ Créer comptes: Vercel, Railway, Neon
2. ✅ Préparer environment variables
3. ✅ Créer Dockerfiles
4. ✅ Déployer BD
5. ✅ Déployer Backend
6. ✅ Déployer Frontend
7. ✅ Tester l'intégration
8. ✅ Configurer domain personnalisé (optionnel)
9. ✅ Mettre en place le monitoring
10. ✅ Documenter le processus

---

## 14. 🚀 Quick Start Command

```bash
#!/bin/bash
# deploy.sh - Script de déploiement complet

echo "🚀 Déploiement SolarEase gratuit"

# 1. Build
echo "📦 Building backend..."
for service in gateway-service identity-service dimensioning-service project-service
do
  cd $service && mvn clean package -DskipTests && cd ..
done

# 2. Frontend
echo "📦 Building frontend..."
cd "SolarEase Web App Design (2)" && npm run build && cd ..

# 3. Push à Git
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy: $(date)"
git push origin main

# 4. Logs
echo "✅ Déploiement lancé!"
echo "📊 Monitorer les logs:"
echo "   - Frontend: https://vercel.com/dashboard"
echo "   - Backend: https://railway.app/dashboard"
echo "   - BD: https://console.neon.tech"

```

---

**Prêt à déployer SolarEase gratuitement! 🎉**
