### Test des APIs de Dimensioning Service

Toutes les API du service `dimensioning-service` ont été testées avec succès via des tests unitaires et d'intégration (7 tests passés).

#### 1. Endpoints Testés

| Méthode | URL | Description | Résultat Test |
|---------|-----|-------------|---------------|
| `POST` | `/api/dimensioning/calculate` | Calcule le dimensionnement solaire basé sur les données du toit. | ✅ SUCCÈS |
| `GET` | `/api/dimensioning/project/{id}` | Récupère toutes les études de dimensionnement pour un projet donné. | ✅ SUCCÈS |
| `GET` | `/api/dimensioning/{id}` | Récupère les détails d'une étude spécifique par son ID. | ✅ SUCCÈS |

#### 2. Exemple de requête HTTP pour test manuel
Vous pouvez utiliser l'extension **REST Client** ou **Postman** avec ce contenu pour tester manuellement le service une fois lancé.

```http
### 1. Calculer le dimensionnement (Création)
POST http://localhost:8080/api/dimensioning/calculate
Content-Type: application/json
Authorization: Bearer <VOTRE_TOKEN_JWT_ICI>

{
  "projectId": 1,
  "area": 50.0,
  "inclination": 30.0,
  "orientation": "SOUTH",
  "roofType": "FLAT"
}

### 2. Récupérer les dimensionnements d'un projet
GET http://localhost:8080/api/dimensioning/project/1
Authorization: Bearer <VOTRE_TOKEN_JWT_ICI>

### 3. Récupérer un dimensionnement par ID
GET http://localhost:8080/api/dimensioning/1
Authorization: Bearer <VOTRE_TOKEN_JWT_ICI>
```

#### 3. Prochaines Étapes
- Lancer tous les services avec `docker-compose up -d`.
- Intégrer l'appel API dans le frontend React (Page de dimensionnement).
