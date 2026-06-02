# n8n — Envoi automatique de facture par e-mail

Quand un **projet est validé** (`COMPLETED`) ou qu'un **devis est accepté** (facture générée), le `project-service` appelle un webhook n8n qui envoie la facture PDF à l'e-mail du client.

## Flux

```
SolarEase (project-service)
  → POST http://n8n:5678/webhook/solarease-invoice
      { invoiceId, clientEmail, projectName, ... }
  → n8n télécharge le PDF (endpoint interne)
  → n8n envoie l'e-mail SMTP avec pièce jointe
```

## Étape 1 — Variables d'environnement

Dans `backend/.env` (copier depuis `.env.example`) :

```env
N8N_ENABLED=true
N8N_INVOICE_WEBHOOK_URL=http://n8n:5678/webhook/solarease-invoice
N8N_INTERNAL_SECRET=change_me_n8n_secret

N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=change_me

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=mot_de_passe_application_gmail
```

> **Gmail** : créer un [mot de passe d'application](https://myaccount.google.com/apppasswords), pas le mot de passe du compte.

Redémarrer la stack :

```bash
cd backend
docker compose up -d --build project-service n8n
```

## Étape 2 — Démarrer n8n

Ouvrir **http://localhost:5678** et se connecter (`N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD`).

## Étape 3 — Importer le workflow

1. n8n → **Workflows** → **Import from File**
2. Choisir `backend/n8n/workflows/send-invoice-email.json`
3. Le workflow **SolarEase — Envoi facture client** apparaît

## Étape 4 — Configurer SMTP dans n8n

1. Ouvrir le nœud **Envoyer email SMTP**
2. **Credential to connect with** → **Create New** → **SMTP**
3. Renseigner :
   - **User** : `SMTP_USER`
   - **Password** : `SMTP_PASSWORD`
   - **Host** : `smtp.gmail.com`
   - **Port** : `587`
   - **SSL/TLS** : STARTTLS
4. **From Email** : la même adresse que `SMTP_USER`
5. Enregistrer la credential **SMTP SolarEase**

## Étape 5 — Secret interne (PDF)

1. Ouvrir le nœud **Telecharger PDF facture**
2. Header `X-Internal-Secret` → mettre **exactement** la même valeur que `N8N_INTERNAL_SECRET` dans `.env`
3. Enregistrer

## Étape 6 — Activer le workflow

1. Bouton **Inactive** → **Active** (en haut à droite)
2. Ouvrir le nœud **Webhook Facture**
3. Copier l'URL de production, par ex. :
   `http://localhost:5678/webhook/solarease-invoice`
4. Vérifier qu'elle correspond à `N8N_INVOICE_WEBHOOK_URL` dans `.env`

## Étape 7 — Test manuel (curl)

```bash
curl -X POST http://localhost:5678/webhook/solarease-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "event": "invoice.ready",
    "trigger": "manual.test",
    "invoiceId": 1,
    "invoiceNumber": "INV-2026-00001",
    "projectId": 1,
    "projectName": "Projet Demo",
    "clientEmail": "votre-email@test.com",
    "amount": 15000,
    "dueDate": "2026-07-01"
  }'
```

Remplacez `invoiceId` par une facture existante en base.

Réponse attendue : `{"status":"sent",...}` et e-mail reçu avec PDF.

## Étape 8 — Test bout en bout (application)

1. Connectez-vous en **client** sur SolarEase
2. **Acceptez un devis** (ou passez un projet en **COMPLETED**)
3. Vérifiez dans n8n → **Executions** : run vert
4. Le client reçoit la facture par e-mail

## Déclencheurs côté backend

| Événement | Trigger n8n |
|-----------|-------------|
| Client accepte un devis | `quote.accepted` |
| Projet passe à `COMPLETED` | `project.completed` |

## Dépannage

| Problème | Solution |
|----------|----------|
| Aucune exécution n8n | `N8N_ENABLED=true` + workflow **Active** |
| 403 sur PDF | `X-Internal-Secret` ≠ `N8N_INTERNAL_SECRET` |
| E-mail non reçu | Vérifier SMTP credential, spam, mot de passe app Gmail |
| `clientEmail missing` | Le client n'a pas d'e-mail en base (`items_client.email`) |
| Webhook 404 | Workflow inactif ou mauvaise URL |

## Fichiers liés

- Workflow : `backend/n8n/workflows/send-invoice-email.json`
- Service webhook : `project-service/.../N8nInvoiceWebhookService.java`
- PDF interne : `GET /api/internal/invoices/{id}/pdf` (réseau Docker uniquement)
