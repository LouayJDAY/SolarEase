# 🚀 Git Workflow Setup - SolarEase

**Statut:** ✅ Configuration Gitflow complète

---

## 📊 État du Repo

```
GitHub: https://github.com/LouayJDAY/SolarEase
Local: /home/louay/Desktop/louay/projetPfe

Branches:
  ✅ main (production)
  ✅ develop (integration)

Commits:
  ✓ chore: Initial commit - documentation and gitignore

Files:
  ✓ README.md (Documentation architecture)
  ✓ CONTRIBUTING.md (Gitflow guide)
  ✓ .gitignore (Maven, Node, IDE, OS)
```

---

## 🌳 Branches Gitflow Setup

```
main (Production)
  ↑
  └─ release/* (Préparation releases)
       ↑
develop (Integration - BASE)
  ↑
  ├─ feature/* (Nouvelles features)
  ├─ bugfix/* (Bug fixes)
  └─ hotfix/* (Urgences depuis main)
```

---

## 🎯 Commandes Git Importantes

### Voir l'état
```bash
cd /home/louay/Desktop/louay/projetPfe
git status
git log --oneline
git branch -a
```

### Créer une feature (pour chaque tâche Jira)
```bash
git checkout develop
git pull origin develop
git checkout -b feature/nom-feature

# Exemple:
git checkout -b feature/auth-login
git checkout -b feature/user-entity
```

### Développer et commiter
```bash
git add .
git commit -m "feat(auth): Description du changement"

# Format: <type>(<scope>): <subject>
# Types: feat, fix, docs, style, refactor, test, chore
```

### Pousser et créer PR
```bash
git push origin feature/nom-feature

# Créer Pull Request sur GitHub
# Base: develop
# Compare: feature/nom-feature
```

### Merger dans develop
```bash
# Après review/tests ✓
git checkout develop
git merge feature/nom-feature
git push origin develop

# Supprimer la feature
git branch -d feature/nom-feature
git push origin --delete feature/nom-feature
```

---

## 📋 Lien Jira ↔ Git

**Chaque commit doit citer le ticket Jira:**

```bash
git commit -m "SOLAR-4: Créer User Entity avec validations

- Ajouter annotations JPA
- Password hashing avec BCrypt

Closes SOLAR-4"
```

**Jira mettra à jour automatiquement !** ✓

---

## 🔐 Protections des Branches

À configurer dans GitHub:

**Settings → Branches → Branch protection rules**

### Pour `main`:
- ✅ Require pull request reviews
- ✅ Require status checks (tests)
- ✅ Require up-to-date branches
- ✅ Dismiss stale PR approvals
- ✅ Require signed commits (optionnel)

### Pour `develop`:
- ✅ Require pull request reviews
- ✅ Require status checks (tests)
- ✅ Require up-to-date branches

---

## 🎯 Sprint 1 Workflow

```
Sprint 1: Identity Service

1. Créer feature depuis develop
   git checkout -b feature/user-entity

2. Développer (commit régulièrement)
   git commit -m "feat(user): Ajouter entity User"
   
3. Pousser et PR
   git push origin feature/user-entity
   → Créer PR sur GitHub

4. Faire passer les tests
   ✓ Tests unitaires
   ✓ Tests d'intégration
   ✓ Code review

5. Merger dans develop
   git merge feature/user-entity
   
6. Supprimer la branche
   git branch -d feature/user-entity
```

---

## 📅 Prochaines Étapes

### À faire maintenant:

- [ ] ✅ Git init + branches main/develop
- [ ] ✅ Fichiers essentiels (README, CONTRIBUTING, .gitignore)
- [ ] ✅ Push sur GitHub
- [ ] 📋 **Configurer protections branches** (GitHub Settings)
- [ ] 🔄 Ajouter les 18 tâches dans Jira (si pas fait)
- [ ] 🚀 Commencer Sprint 1

### Pour chaque tâche Jira:

1. Créer feature branche
2. Développer avec commits réguliers
3. Tester localement
4. Pousser et créer PR
5. Review et merger

---

## 🔗 Ressources

- **Repo GitHub:** https://github.com/LouayJDAY/SolarEase
- **Documentation:** [README.md](./README.md)
- **Guide Contribution:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Jira Board:** https://jdalouary.atlassian.net/jira (Projet SOLAR)

---

## ✅ Configuration Checklist

- [x] Git init
- [x] Branches main + develop
- [x] Commits initiaux
- [x] Push sur GitHub
- [ ] Protections branches (à faire sur GitHub UI)
- [ ] Ajouter secrets (.env) si nécessaire
- [ ] Configurer CI/CD (GitHub Actions - optionnel)

---

## 🚀 Ready to Code!

```
Le projet est prêt ! 🎉

Prochaine étape: Commencer Sprint 1 - Identity Service
Créer les tâches dans Jira (18 items)
Créer feature branches et commencer le développement
```

---

**Dernière mise à jour:** 3 Février 2026  
**Créé par:** Louay  
**Email:** louay@solarease.com
