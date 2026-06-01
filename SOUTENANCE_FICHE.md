**SolarEase — Fiche de soutenance**

**But**: Présenter SolarEase — SPA React (Vite) + microservices Spring Boot (Identity, Project, Dimensioning) exposés via un `gateway`. Observabilité par Prometheus / Grafana / Loki.

**Architecture (brefs points)**
- **Frontend**: Single Page App React (Vite). Dev server: port 5173.
- **Gateway**: point d'entrée HTTP, vérifie JWT et routage vers microservices.
- **Microservices**: `identity-service`, `project-service`, `dimensioning-service` (chaque service a sa propre base Postgres).
- **Observabilité**: Prometheus (9090) + Grafana (3000) + Loki/Promtail (logs).

**Flux utilisateur (inscription — vérification OTP — Dashboard)**
- Front: `RegisterPage` → envoie POST vers `gateway`.
- Gateway: forward → `identity-service` qui crée user et envoie OTP par mail.
- Front: `OTPVerificationPage` envoie code → `identity-service` renvoie JWT.
- Front stocke JWT (localStorage) → appels protégés via `gateway`.

**Fichiers importants**
- Frontend entry: [SolarEase Web App Design (2)/src/main.tsx](SolarEase%20Web%20App%20Design%20(2)/src/main.tsx)
- Routes / pages: [SolarEase Web App Design (2)/src/app/routes.ts](SolarEase%20Web%20App%20Design%20(2)/src/app/routes.ts)
- Register page: [SolarEase Web App Design (2)/src/app/pages/RegisterPage.tsx](SolarEase%20Web%20App%20Design%20(2)/src/app/pages/RegisterPage.tsx)
- Identity service: [backend/identity-service](backend/identity-service)

**Points à mettre en avant pendant la soutenance**
- Séparation des responsabilités (microservices) et isolation des DB.
- Flow d’authentification (OTP → JWT) et sécurité basique par gateway.
- Observabilité: comment Prometheus scrape les `/actuator/prometheus` et Grafana présente les métriques.
- Décision pratique: frontend en dev local (vite) vs frontend build dans Docker pour prod.

**Limitations connues / préparations pour la démo**
- Problème courant: `npm ci` dans Docker peut échouer si `package-lock.json` est désynchronisé — solution: `npm install` + commit du lock ou changer Dockerfile.

**Trame de démonstration (3 minutes)**
- 0:00 — Ouvrir la page vitrine (frontend dev local, port 5173).
- 0:40 — Remplir le formulaire d’inscription (Register) et montrer la requête réseau.
- 1:20 — Vérifier la réception OTP (ou forcer dans dev) → soumettre OTP.
- 1:50 — Montrer le Dashboard après connexion (JWT en localStorage).
- 2:10 — Basculer sur Grafana → tableau de bord et Prometheus targets.
- 2:40 — Terminer avec architecture et limitations.

Besoin d’une version PDF prête à imprimer ? Je peux convertir ce Markdown en PDF et te fournir le fichier.