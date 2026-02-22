# ☀️ SolarEase - Plateforme Intelligente de Dimensionnement Solaire

**Développement d'une plateforme intelligente d'aide à la vente et au dimensionnement solaire dédiée aux sociétés d'installation de panneaux solaires et à leurs clients.**

---

## 📋 Vue d'ensemble

SolarEase est une plateforme complète qui aide les installateurs solaires à:
- 💰 **Vendre** efficacement des solutions solaires
- 📊 **Dimensionner** des installations avec précision
- 📈 **Générer des devis** professionnels
- 📱 **Gérer** les clients et projets

---

## 🏗️ Architecture Microservices

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 8080)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ Identity Service│  │ Projects Service │  │ Dimensioning│
│  │   (Port 8081)   │  │   (Port 8082)    │  │ Service     │
│  └────────┬────────┘  └────────┬─────────┘  │ (Port 8083)│
│           │                     │            └────────────┘
│           ▼                     ▼                   ▼       │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ solarease_      │  │ solarease_       │  │solarease_  │ │
│  │ identity (DB)   │  │ projects (DB)    │  │dimensioning│ │
│  └─────────────────┘  └──────────────────┘  │(DB)        │ │
│                                              └────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Technique

### Backend
- **Framework:** Spring Boot 3.2
- **Language:** Java 17 LTS
- **Build:** Maven
- **Database:** PostgreSQL 16
- **Authentication:** JWT + Spring Security
- **API:** RESTful + Swagger/OpenAPI

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **UI Components:** Radix UI
- **Router:** React Router v6

### Infrastructure
- **Container:** Docker + Docker Compose
- **Version Control:** Git + GitHub (Gitflow)
- **Project Management:** Jira Kanban
- **Database GUI:** DBeaver

---

## 📦 Bases de Données

### 1. **solarease_identity**
Gestion d'authentification et des utilisateurs
```sql
- users (id, uuid, email, password_hash, role)
- companies (id, name, registration_number)
- refresh_tokens (id, user_id, token, expiry)
```

### 2. **solarease_projects**
Gestion des clients et projets
```sql
- clients (id, uuid, first_name, last_name, email)
- projects (id, uuid, client_id, name, status)
- quotes (id, project_id, total_amount, pdf_url)
- quote_items (id, quote_id, description, unit_price)
```

### 3. **solarease_dimensioning**
Calculs techniques et simulations
```sql
- installations (id, project_id, peak_power, panel_count)
- simulations (id, installation_id, estimated_production)
- solar_panels_catalog (id, name, power_rating, efficiency)
- inverters_catalog (id, name, power_rating, efficiency)
```

---

## 🚀 Démarrage Rapide

### Prérequis
- Java 17 JDK
- Maven 3.8+
- PostgreSQL 16
- Node.js 18+
- Git

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/LouayJDAY/SolarEase.git
cd SolarEase
```

2. **Configurer PostgreSQL**
```bash
psql -U postgres
CREATE DATABASE solarease_identity;
CREATE DATABASE solarease_projects;
CREATE DATABASE solarease_dimensioning;
```

3. **Backend - Identity Service**
```bash
cd identity-service
mvn clean package
java -jar target/identity-service.jar
# Accessible: http://localhost:8081
```

4. **Backend - Projects Service**
```bash
cd project-service
mvn clean package
java -jar target/project-service.jar
# Accessible: http://localhost:8082
```

5. **Backend - Dimensioning Service**
```bash
cd dimensioning-service
mvn clean package
java -jar target/dimensioning-service.jar
# Accessible: http://localhost:8083
```

6. **Frontend**
```bash
cd frontend
npm install
npm run dev
# Accessible: http://localhost:3000
```

---

## 📖 Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/SCHEMA.md)
- [User Stories & Cahier des Charges](./USER_STORIES.md)
- [Git Workflow](./CONTRIBUTING.md)

---

## 🔄 Git Workflow (Gitflow)

```
main (Production)
  ↑
  └─ release/v1.0
       ↑
develop (Development)
  ↑
  ├─ feature/auth
  ├─ feature/projects
  ├─ feature/dimensioning
  └─ bugfix/xyz
```

**Commandes principales:**
```bash
# Créer une feature
git checkout develop
git checkout -b feature/nom-feature
# ... travail ...
git push origin feature/nom-feature

# Merger dans develop
git checkout develop
git merge feature/nom-feature

# Release (main)
git checkout main
git merge develop
git tag v1.0.0
git push origin main --tags
```

---

## 📊 Kanban Board

Tous les sprints et tâches sont gérés via **Jira Kanban**:
- 📋 À FAIRE
- 🔄 EN COURS
- 👀 À RÉVISER
- ✅ TERMINÉ

**Sprint 1 Focus:** Identity Service (Authentication)

---

## 📝 Contribution

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour les guidelines

---

## 📄 Licence

MIT License - Voir LICENSE.md

---

## 👥 Équipe

- **Développeur:** Louay (Solo PFE Project)
- **Email:** louay@solarease.com
- **GitHub:** [@LouayJDAY](https://github.com/LouayJDAY)

---

## 📞 Support

Pour questions ou support:
- Email: louay@solarease.com
- GitHub Issues: [Créer une issue](https://github.com/LouayJDAY/SolarEase/issues)

---

**Dernière mise à jour:** 3 Février 2026
