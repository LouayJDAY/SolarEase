# Commandes de Test API - SolarEase

Ce document regroupe les commandes `curl` pour tester le flux complet de l'application (Authentification, Clients, Projets).

## 1. Authentification

### a. Inscription (Register)
Crée un nouvel utilisateur.
```bash
curl -v -X POST http://localhost:8080/api/auth/register \
-H "Content-Type: application/json" \
-d '{
    "username": "testuserfinal",
    "firstName": "Test",
    "lastName": "Final",
    "email": "test.final@example.com",
    "password": "Password123!",
    "role": "USER"
}'
```

### b. Récupérer le code OTP
Puisque nous n'avons pas de service d'email réel configuré, récupérez le code directement depuis la base de données.
```bash
docker exec -i solarease-postgres psql -U louay -d solarease_identity -c "SELECT otp_code FROM otp_tokens JOIN users ON otp_tokens.user_id = users.id WHERE users.email = 'test.final@example.com' ORDER BY otp_tokens.created_at DESC LIMIT 1;"
```

### c. Vérification OTP
Remplacez `"123456"` par le code obtenu à l'étape précédente.
```bash
curl -v -X POST http://localhost:8080/api/auth/verify-otp \
-H "Content-Type: application/json" \
-d '{
    "email": "test.final@example.com",
    "otpCode": "123456"
}'
```

### d. Connexion (Login)
Récupère le token JWT.
```bash
curl -v -X POST http://localhost:8080/api/auth/login \
-H "Content-Type: application/json" \
-d '{
    "email": "test.final@example.com",
    "password": "Password123!"
}'
```

**Note :** Copiez le `accessToken` de la réponse pour les requêtes suivantes.
```bash
export TOKEN="votre_token_jwt_ici"
```

---

## 2. Service Projet

Tous les appels suivants nécessitent le Header `Authorization`.

### a. Créer un Client
Nécessaire avant de créer un projet.
```bash
curl -v -X POST http://localhost:8080/api/clients \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@client.com"
}'
```

### b. Créer un Projet
Remplacez `clientId` par l'ID retourné à l'étape précédente (ex: `1`).
```bash
curl -v -X POST http://localhost:8080/api/projects \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
    "name": "Installation Solaire 1",
    "description": "Projet résidentiel test",
    "clientId": 1
}'
```

### c. Lister les Projets
```bash
curl -v -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/projects
```
