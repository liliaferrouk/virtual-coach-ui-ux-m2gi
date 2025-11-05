# Virtual Coach - Mobile App

Application mobile Flutter pour un coach virtuel de fitness.

## Fonctionnalités

- **Écran d'accueil** : Vue d'ensemble avec calendrier et statistiques quotidiennes
- **Catégories d'entraînement** : 6 types d'entraînements (Bras, Cardio, Cuisses, Fessiers, Abdos, Corps complet)
- **Détails d'entraînement** : Liste des exercices avec séries et répétitions
- **Calendrier intégré** : Suivi des séances d'entraînement
- **Interface moderne** : Design sombre avec dégradés colorés

## Structure du projet

```
mobile/
├── lib/
│   ├── main.dart                          # Point d'entrée de l'application
│   ├── models/
│   │   └── workout.dart                   # Modèle de données Workout
│   ├── data/
│   │   └── workout_data.dart              # Données statiques des entraînements
│   └── screens/
│       ├── home_screen.dart               # Écran d'accueil
│       ├── workout_categories_screen.dart # Liste des catégories
│       └── workout_detail_screen.dart     # Détails d'un entraînement
├── assets/
│   └── images/                            # Images de l'application
└── pubspec.yaml                           # Dépendances Flutter
```

## Installation

### Prérequis

- Flutter SDK (>= 3.0.0)
- Android Studio / Xcode (pour les émulateurs)
- Un éditeur de code (VS Code, Android Studio, etc.)

### Étapes

1. **Installer Flutter** (si ce n'est pas déjà fait)
   ```bash
   # Vérifier si Flutter est installé
   flutter --version
   ```

2. **Naviguer vers le dossier du projet**
   ```bash
   cd mobile
   ```

3. **Installer les dépendances**
   ```bash
   flutter pub get
   ```

4. **Lancer l'application**

   **Sur un émulateur Android :**
   ```bash
   flutter run
   ```

   **Sur un émulateur iOS (macOS uniquement) :**
   ```bash
   flutter run
   ```

   **Sur Chrome (pour tester rapidement) :**
   ```bash
   flutter run -d chrome
   ```

## Dépendances principales

- `table_calendar`: ^3.0.9 - Widget de calendrier interactif
- `intl`: ^0.18.0 - Internationalisation et formatage de dates

## Personnalisation

### Ajouter de nouveaux entraînements

Modifiez le fichier [lib/data/workout_data.dart](lib/data/workout_data.dart) :

```dart
Workout(
  id: '7',
  name: 'Yoga',
  description: 'Améliorer la flexibilité et la relaxation',
  exerciseCount: 15,
  durationMinutes: 30,
  category: WorkoutCategory.fullBody,
),
```

### Modifier les couleurs du thème

Éditez [lib/main.dart](lib/main.dart) dans la section `ThemeData` :

```dart
colorScheme: ColorScheme.dark(
  primary: const Color(0xFF6C63FF),  // Couleur principale
  secondary: const Color(0xFFFF6584), // Couleur secondaire
  // ...
),
```

## Commandes utiles

```bash
# Obtenir les dépendances
flutter pub get

# Nettoyer le projet
flutter clean

# Lancer l'application
flutter run

# Construire pour Android
flutter build apk

# Construire pour iOS
flutter build ios

# Lister les appareils disponibles
flutter devices
```

## Captures d'écran

L'application comprend :
- Un écran d'accueil avec un bouton "Let's Gym" et un calendrier
- Une liste de catégories d'entraînement avec des cartes colorées
- Des écrans de détails avec la liste des exercices

## Développement futur

- Ajout de vidéos d'exercices
- Suivi des progrès et statistiques
- Minuteur intégré pour les exercices
- Plans d'entraînement personnalisés
- Notifications de rappel
- Intégration avec des appareils fitness
