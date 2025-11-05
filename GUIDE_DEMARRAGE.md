# Guide de Démarrage - Virtual Coach

Ce projet contient deux versions de l'application Virtual Coach :
- **webapp/** : Version web (HTML/CSS/JS)
- **mobile/** : Version mobile (Flutter)

---

## Version Web (webapp/)

### Lancement rapide

**Option 1 - Python :**
```bash
cd webapp
python3 -m http.server 8000
# Ouvrir http://localhost:8000 dans votre navigateur
```

**Option 2 - Node.js :**
```bash
cd webapp
npx http-server -p 8000
# Ouvrir http://localhost:8000 dans votre navigateur
```

**Option 3 - VSCode Live Server :**
1. Installer l'extension "Live Server"
2. Clic droit sur `webapp/index.html`
3. Sélectionner "Open with Live Server"

---

## Version Mobile (mobile/)

### Prérequis
- Flutter SDK installé (>= 3.0.0)
- Un émulateur Android/iOS ou un appareil physique

### Installation

1. **Vérifier Flutter :**
   ```bash
   flutter doctor
   ```

2. **Installer les dépendances :**
   ```bash
   cd mobile
   flutter pub get
   ```

3. **Lancer l'application :**

   **Sur émulateur/appareil :**
   ```bash
   flutter run
   ```

   **Sur Chrome (test rapide) :**
   ```bash
   flutter run -d chrome
   ```

### Fonctionnalités de l'app mobile

- Écran d'accueil avec calendrier intégré
- 6 catégories d'entraînement (Bras, Cardio, Cuisses, Fessiers, Abdos, Corps complet)
- Détails des exercices avec séries et répétitions
- Interface moderne avec thème sombre
- Statistiques d'activité quotidienne

---

## Structure du projet

```
virtual-coach-ui-ux-m2gi/
├── webapp/                  # Application web
│   ├── index.html          # Page principale
│   ├── secondpage.html     # Page catégories
│   ├── thirdpage.html      # Page détails
│   ├── style.css           # Styles
│   ├── app.js              # Scripts
│   └── assets/             # Images et ressources
│
├── mobile/                  # Application Flutter
│   ├── lib/
│   │   ├── main.dart       # Point d'entrée
│   │   ├── models/         # Modèles de données
│   │   ├── data/           # Données statiques
│   │   └── screens/        # Écrans de l'app
│   ├── assets/             # Ressources
│   └── pubspec.yaml        # Dépendances
│
└── GUIDE_DEMARRAGE.md      # Ce fichier
```

---

## Comparaison des versions

| Fonctionnalité | Web | Mobile |
|----------------|-----|--------|
| Calendrier | ✓ | ✓ |
| Catégories d'entraînement | ✓ | ✓ |
| Détails exercices | ✓ | ✓ |
| Navigation fluide | ✓ | ✓ |
| Design responsive | ✓ | ✓ |
| Notifications | ✗ | ✓ (futur) |
| Mode hors-ligne | ✗ | ✓ (futur) |

---

## Besoin d'aide ?

- **Web** : Voir `webapp/` - application simple HTML/CSS/JS
- **Mobile** : Voir `mobile/README.md` - documentation complète Flutter
- **Flutter** : https://docs.flutter.dev/
- **webOS TV** : L'application web est conçue pour LG Smart TV

---

Bon entraînement ! 🏋️‍♂️
