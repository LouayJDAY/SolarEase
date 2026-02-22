# ☀️ SolarEase - User Stories & Cahier des Charges

Ce document décrit en détail les User Stories de la plateforme **SolarEase**, basées sur les exigences fonctionnelles et les besoins des utilisateurs (Installateurs & Clients Finaux).

---

## 🏗️ Epic 1: Espace Installateur - Gestion des Clients & Projets

L'objectif est d'offrir aux installateurs un outil CRM complet pour gérer leur pipeline commercial et technique.

| ID | Titre | Description (En tant que <Rôle>, je veux <Action> afin de <But>) | Critères d'Acceptation | Complexité |
|---|---|---|---|---|
| US-101 | **Création Fiche Client** | En tant qu'**Installateur**, je veux **créer une fiche client** (nom, adresse, contact) afin de centraliser ses informations. | - Formulaire de création complet<br>- Validation des données (email, tél)<br>- Stockage en base de données | 3/10 |
| US-102 | **Gestion Portefeuille** | En tant qu'**Installateur**, je veux **voir la liste de mes clients** avec un moteur de recherche afin de retrouver rapidement un dossier. | - Liste paginée des clients<br>- Filtres par nom, ville, statut<br>- Accès rapide à la fiche client | 4/10 |
| US-103 | **Création Projet Solaire** | En tant qu'**Installateur**, je veux **créer un nouveau projet** associé à un client existant afin de lancer une étude technique. | - Lien direct Client <-> Projet<br>- Statut initial "Brouillon" ou "Étude"<br>- Saisie adresse d'installation (Google Maps API?) | 5/10 |
| US-104 | **Tableau de Bord Commercial** | En tant qu'**Installateur**, je veux **visualiser un tableau de bord** avec mes KPI (projets en cours, devis signés, CA potentiel) afin de piloter mon activité. | - Graphiques (camembert, barres)<br>- Indicateurs clés (Nombre de projets, Taux de conversion)<br>- Mise à jour temps réel | 8/10 |

---

## 📐 Epic 2: Dimensionnement & Simulation Solaire Technique

Le cœur du réacteur : permettre un dimensionnement précis et rapide des installations.

| ID | Titre | Description | Critères d'Acceptation | Complexité |
|---|---|---|---|---|
| US-201 | **Dimensionnement Automatique** | En tant qu'**Installateur**, je veux **obtenir une suggestion de dimensionnement automatique** basée sur la consommation du client et la surface disponible afin de gagner du temps. | - Algorithme prenant en compte la conso annuelle<br>- Suggestion nombre de panneaux & onduleur<br>- Calcul du productible théorique | 10/10 |
| US-202 | **Configuration Manuelle** | En tant qu'**Installateur**, je veux **ajuster manuellement la configuration** (type de panneaux, orientation, inclinaison) afin d'affiner l'étude. | - Interface drag & drop ou champs numériques<br>- Choix matériel depuis catalogue<br>- Recalcul immédiat des résultats | 7/10 |
| US-203 | **Simulation "Night Panel"** | En tant qu'**Installateur**, je veux **simuler l'ajout de "Night Panels"** (stockage/batterie virtuelle ou techno spécifique) afin de voir l'impact sur l'autoconsommation nocturne. | - Option spécifique "Night Panel"<br>- Comparatif Courbe de charge vs Production<br>- Calcul du taux d'autoconsommation amélioré | 9/10 |
| US-204 | **Comparateur de Scénarios** | En tant qu'**Installateur**, je veux **comparer deux configurations** (ex: Standard vs Premium) côte à côte afin d'aider le client à choisir. | - Vue split-screen ou tableau comparatif<br>- Différence de coût, de production et de ROI mise en évidence | 8/10 |

---

## 💰 Epic 3: Devis & Rapports Commerciaux

Transformer l'étude technique en proposition commerciale convaincante.

| ID | Titre | Description | Critères d'Acceptation | Complexité |
|---|---|---|---|---|
| US-301 | **Calcul Financier & ROI** | En tant qu'**Installateur**, je veux **que le système calcule automatiquement le ROI**, le temps de retour sur investissement et les économies sur 20 ans. | - Prise en compte de l'inflation de l'électricité<br>- Coût de l'installation<br>- Cash-flow cumulé | 7/10 |
| US-302 | **Génération Devis PDF** | En tant qu'**Installateur**, je veux **générer un devis officiel au format PDF** incluant le détail technique et financier. | - Template professionnel personnalisable (Logo installateur)<br>- Détail matériel et main d'œuvre<br>- Mentions légales | 6/10 |
| US-303 | **Rapport d'Étude Détaillé** | En tant qu'**Installateur**, je veux **générer un rapport d'étude complet** (production mois par mois, impact CO2) pour le remettre au client. | - Graphiques de production<br>- Explication pédagogique des gains<br>- Argumentaire écologique (CO2 évité) | 6/10 |

---

## 🌍 Epic 4: Espace Client Final

Donner de la visibilité et rassurer le client final.

| ID | Titre | Description | Critères d'Acceptation | Complexité |
|---|---|---|---|---|
| US-401 | **Simulation Simplifiée** | En tant que **Client Final**, je veux **réaliser une simulation rapide** sur le site (adresse, facture élec) afin d'avoir une première estimation. | - Formulaire simple (3 étapes max)<br>- Estimation "Fourchette" de prix et gains<br>- Call-to-action "Demander un devis détaillé" | 6/10 |
| US-402 | **Suivi de Projet** | En tant que **Client Final**, je veux **suivre l'avancement de mon installation** (Étude, Validation, Installation, Mise en service) depuis mon espace personnel. | - Timeline avec étapes clés<br>- Notifications de changement de statut<br>- Visibilité sur les dates prévues | 5/10 |
| US-403 | **Visualisation Écolo & Financière** | En tant que **Client Final**, je veux **voir concrètement mes gains** (Arbres plantés équivalents, Euros économisés) de manière ludique. | - Widgets visuels et simples<br>- Équivalences parlantes (ex: Km en voiture économisés)<br>- Projections sur 10/20 ans | 4/10 |

---

## 🧠 Epic 5: Intelligence Artificielle & Innovation

La couche "Plus-Value" de la plateforme.

| ID | Titre | Description | Critères d'Acceptation | Complexité |
|---|---|---|---|---|
| US-501 | **Prédiction de Production (IA)** | En tant qu'**Utilisateur**, je veux **une prédiction précise de la production** basée sur l'historique météo local et l'ensoleillement réel (données satellites?). | - Intégration API Météo/Ensoleillement<br>- Modèle prédictif prenant en compte l'orientation/inclinaison<br>- Marge d'erreur réduite | 9/10 |
| US-502 | **Recommandation Intelligente** | En tant qu'**Installateur**, je veux **que le système me recommande la meilleure configuration** (Orientation optimale, Type de panneau) pour maximiser le ROI du client. | - Algorithme d'optimisation<br>- Suggestion automatique "Le meilleur choix technique est..."<br>- Justification de la recommandation par la data | 10/10 |
| US-503 | **Détection de Potentiel** | En tant qu'**Installateur**, je veux **identifier mes dossiers clients à fort potentiel** (ex: toiture sud, grosse consommation) pour prioriser mes relances. | - Scoring automatique des prospects<br>- Tri intelligent dans le CRM<br>- "Hot Leads" mis en avant | 7/10 |

---

## ⚙️ Epic 6: Administration & Configuration (Système)

| ID | Titre | Description | Critères d'Acceptation | Complexité |
|---|---|---|---|---|
| US-601 | **Gestion Catalogue Matériel** | En tant qu'**Administrateur**, je veux **gérer le catalogue de panneaux et onduleurs** (ajouter/modifier/supprimer des références) pour que les installateurs aient des données à jour. | - CRUD complet sur le matériel<br>- Caractéristiques techniques (Puissance, Rendement, Dimensions) | 4/10 |
| US-602 | **Gestion Utilisateurs Système** | En tant qu'**Administrateur**, je veux **gérer les accès des installateurs** (validation compte pro) pour sécuriser la plateforme. | - Validation des inscriptions installateurs (Kbis, Certifs)<br>- Blocage/Suspension de comptes | 3/10 |
