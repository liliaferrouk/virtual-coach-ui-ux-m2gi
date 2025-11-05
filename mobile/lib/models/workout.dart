class Workout {
  final String id;
  final String name;
  final String description;
  final int exerciseCount;
  final int durationMinutes;
  final String? imageAsset;
  final WorkoutCategory category;

  Workout({
    required this.id,
    required this.name,
    required this.description,
    required this.exerciseCount,
    required this.durationMinutes,
    this.imageAsset,
    required this.category,
  });
}

enum WorkoutCategory {
  arms,
  cardio,
  thighs,
  butt,
  abs,
  fullBody,
}

extension WorkoutCategoryExtension on WorkoutCategory {
  String get displayName {
    switch (this) {
      case WorkoutCategory.arms:
        return 'Arms';
      case WorkoutCategory.cardio:
        return 'Cardio';
      case WorkoutCategory.thighs:
        return 'Thighs';
      case WorkoutCategory.butt:
        return 'Butt';
      case WorkoutCategory.abs:
        return 'Abs';
      case WorkoutCategory.fullBody:
        return 'Full Body';
    }
  }
}
