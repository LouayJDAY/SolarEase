# 📝 Guide de Contribution - SolarEase

**Bienvenue!** Ce document explique comment contribuer au projet SolarEase en utilisant le workflow **Gitflow**.

---

## 🌳 Gitflow Workflow

### Structure des Branches

```
main                    ← Production (releases)
  ↑
  └─ release/v1.0      ← Préparation release
       ↑
develop                 ← Intégration des features
  ↑
  ├─ feature/*         ← Nouvelles fonctionnalités
  ├─ bugfix/*          ← Corrections bugs non-critiques
  └─ hotfix/*          ← Corrections urgentes (depuis main)
```

---

## 🎯 Workflow Complet

### 1️⃣ Créer une Feature

```bash
# Mettre à jour develop
git checkout develop
git pull origin develop

# Créer une branche feature
git checkout -b feature/nom-feature

# Exemple:
git checkout -b feature/auth-login
git checkout -b feature/clients-crud
git checkout -b feature/dimensioning-engine
```

**Nommage des features:**
```
feature/auth-*             (Authentification)
feature/clients-*          (Gestion clients)
feature/projects-*         (Gestion projets)
feature/dimensioning-*     (Calculs solaires)
feature/quotes-*           (Génération devis)
feature/admin-*            (Admin panel)
```

---

### 2️⃣ Développer

```bash
# Travailler sur ta feature
git add .
git commit -m "SOLAR-X: Description du commit"

# Exemple de message:
git commit -m "SOLAR-4: Créer endpoint POST /auth/login

- Valider credentials utilisateur
- Générer JWT token
- Ajouter tests unitaires

Closes SOLAR-4"
```

**Format du commit:**
```
<TICKET>: <Description courte>

<Description longue optionnelle>

Closes <TICKET>
```

---

### 3️⃣ Pousser et Faire une Pull Request

```bash
# Pousser la feature
git push origin feature/nom-feature

# Créer une Pull Request sur GitHub
# - Base: develop
# - Compare: feature/nom-feature
```

**Template PR:**
```markdown
## 📋 Description
Brève description de ce que cette PR fait

## 🎯 Ticket Jira
Closes SOLAR-4

## 🔍 Type de changement
- [ ] Feature (nouvelle fonctionnalité)
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactoring

## ✅ Checklist
- [ ] Code compilé sans erreurs
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Code review effectuée
- [ ] Documentation mise à jour
- [ ] Aucun console.log() ou TODO restant

## 🖼️ Screenshots (si applicable)
N/A
```

---

### 4️⃣ Merger dans Develop

```bash
# Code review ✓
# Tests passent ✓

# Merger la feature
git checkout develop
git merge feature/nom-feature
git push origin develop

# Supprimer la branche feature
git branch -d feature/nom-feature
git push origin --delete feature/nom-feature
```

---

### 5️⃣ Release (Quand prêt pour production)

```bash
# Créer branche release
git checkout -b release/v1.0 develop

# Mettre à jour version et changelog
# ... changements ...

git add .
git commit -m "chore: Préparer release v1.0"
git push origin release/v1.0

# Merger dans main
git checkout main
git merge release/v1.0
git tag -a v1.0 -m "Release version 1.0"
git push origin main --tags

# Merger le tag back dans develop
git checkout develop
git merge release/v1.0
git push origin develop

# Supprimer branche release
git branch -d release/v1.0
git push origin --delete release/v1.0
```

---

### 🔥 Hotfix (Correction urgente)

```bash
# Créer depuis main
git checkout -b hotfix/critical-bug main

# ... correction du bug ...

git add .
git commit -m "hotfix: Corriger bug critique XXX"
git push origin hotfix/critical-bug

# Merger dans main
git checkout main
git merge hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix v1.0.1"
git push origin main --tags

# Merger dans develop
git checkout develop
git merge hotfix/critical-bug
git push origin develop

# Supprimer
git branch -d hotfix/critical-bug
git push origin --delete hotfix/critical-bug
```

---

## 📋 Commits Conventionnels

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
```
feat:       Nouvelle fonctionnalité
fix:        Correction bug
docs:       Documentation
style:      Format, typos
refactor:   Restructuration du code
perf:       Amélioration performance
test:       Tests
chore:      Build, dépendances, etc
ci:         CI/CD
```

**Exemples:**
```bash
# Feature
git commit -m "feat(auth): Ajouter JWT token generation"

# Bug fix
git commit -m "fix(login): Corriger validation email"

# Documentation
git commit -m "docs(readme): Ajouter instructions setup"

# Tests
git commit -m "test(auth): Ajouter tests login endpoint"
```

---

## ✅ Code Quality Checklist

Avant de pousser, assure-toi que:

- [ ] **Code compilé** sans erreurs/warnings
- [ ] **Tests unitaires** - Au moins 80% coverage
- [ ] **Tests d'intégration** passent
- [ ] **Linting** - Format code ok (`mvn spotless:check` ou `npm run lint`)
- [ ] **Documentation** - Code commenté et README mis à jour
- [ ] **Pas de secrets** - Pas de passwords, tokens, api keys
- [ ] **Performance** - Pas de N+1 queries, optimisé
- [ ] **Sécurité** - Validations inputs, SQL injection prevention
- [ ] **No console.log()** - En production
- [ ] **No TODO/FIXME** - Avant merge

---

## 🧪 Tests

### Backend (Java)

```bash
# Lancer les tests
mvn clean test

# Vérifier coverage
mvn jacoco:report

# 80%+ coverage requis!
```

### Frontend (React)

```bash
# Lancer tests
npm run test

# Coverage
npm run test:coverage

# Lint
npm run lint
```

---

## 📊 Jira Integration

Chaque commit doit référencer un ticket Jira:

```bash
# Dans le message de commit:
git commit -m "SOLAR-4: Description du travail"

# Jira met à jour automatiquement l'issue ✓
```

**Status Jira:**
- 📋 TO DO
- 🔄 IN PROGRESS (quand tu commences)
- 👀 IN REVIEW (quand PR ouverte)
- ✅ DONE (quand mergé dans develop)

---

## 🔐 Protections de branches

### main
```
- ✅ Require pull request reviews
- ✅ Require status checks (tests)
- ✅ Require up-to-date branches
- ❌ Permet force pushes (interdit!)
```

### develop
```
- ✅ Require pull request reviews
- ✅ Require status checks (tests)
- ✅ Require up-to-date branches
```

---

## 📚 Ressources

- [Gitflow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

## 💡 Bonnes Pratiques

### ✅ À FAIRE

1. **Commits petits et logiques**
   ```
   ✓ "feat: Ajouter validation email"
   ✗ "feat: Implémenter toute l'auth et BD et frontend"
   ```

2. **Rebase avant merge** (keep history clean)
   ```bash
   git rebase develop
   git push --force-with-lease origin feature/nom
   ```

3. **Écrire des messages clairs**
   ```
   ✓ "Fix null pointer in user service"
   ✗ "fix stuff"
   ```

4. **Une feature = une PR**
   ```
   ✓ 1 feature = 1 branche = 1 PR
   ✗ Mélanger features dans 1 branche
   ```

### ❌ À ÉVITER

1. **Commiter directement dans main/develop**
   ```bash
   ✗ git checkout main && git add . && git commit
   ✓ git checkout -b feature/... && git commit
   ```

2. **Force push sans `--force-with-lease`**
   ```bash
   ✗ git push --force
   ✓ git push --force-with-lease
   ```

3. **Merge commits (rebaser à la place)**
   ```bash
   ✗ Merge branch 'feature' into develop
   ✓ Rebase et merge (clean history)
   ```

4. **Oublier de tester avant de pousser**
   ```bash
   ✗ git push && git commit (backwards!)
   ✓ tests ✓ → git add → git commit → git push
   ```

---

## 🚨 Troubleshooting

### Annuler un commit
```bash
# Avant push
git reset --soft HEAD~1

# Après push
git revert <commit-hash>
```

### Changer le dernier commit
```bash
git commit --amend --no-edit
git push --force-with-lease
```

### Mettre à jour ta feature avec develop
```bash
git fetch origin
git rebase origin/develop
git push --force-with-lease
```

---

## 📞 Questions?

Contact: louay@solarease.com

---

**Merci de contribuer! 🎉**

