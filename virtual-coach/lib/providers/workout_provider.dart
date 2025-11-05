import 'package:flutter/foundation.dart';

class WorkoutProvider extends ChangeNotifier {
  int _squatCount = 0;
  int _goodSquats = 0;
  int _badSquats = 0;
  final int _targetReps = 20;

  int get squatCount => _squatCount;
  int get goodSquats => _goodSquats;
  int get badSquats => _badSquats;
  int get targetReps => _targetReps;

  double get goodPercentage {
    if (_squatCount == 0) return 0;
    return (_goodSquats / _squatCount) * 100;
  }

  double get badPercentage {
    if (_squatCount == 0) return 0;
    return (_badSquats / _squatCount) * 100;
  }

  void addSquat(bool isGoodForm) {
    _squatCount++;
    if (isGoodForm) {
      _goodSquats++;
    } else {
      _badSquats++;
    }
    notifyListeners();
  }

  void resetSquats() {
    _squatCount = 0;
    _goodSquats = 0;
    _badSquats = 0;
    notifyListeners();
  }
}

class Exercise {
  final String name;
  final String imagePath;
  final String duration;
  final int exerciseCount;

  Exercise({
    required this.name,
    required this.imagePath,
    required this.duration,
    required this.exerciseCount,
  });
}

class WorkoutCategory {
  final String name;
  final String imagePath;
  final int exerciseCount;
  final String duration;

  WorkoutCategory({
    required this.name,
    required this.imagePath,
    required this.exerciseCount,
    required this.duration,
  });
}

final List<WorkoutCategory> workoutCategories = [
  WorkoutCategory(
    name: 'Arms',
    imagePath: 'assets/images/arms.png',
    exerciseCount: 30,
    duration: '45 minutes',
  ),
  WorkoutCategory(
    name: 'Cardio',
    imagePath: 'assets/images/cardio.png',
    exerciseCount: 19,
    duration: '30 minutes',
  ),
  WorkoutCategory(
    name: 'Thighs',
    imagePath: 'assets/images/thighs.png',
    exerciseCount: 25,
    duration: '40 minutes',
  ),
  WorkoutCategory(
    name: 'Butt',
    imagePath: 'assets/images/butt.png',
    exerciseCount: 19,
    duration: '30 minutes',
  ),
];

final List<Exercise> exercises = [
  Exercise(
    name: 'Squats',
    imagePath: 'assets/images/running.png',
    duration: '10 minutes',
    exerciseCount: 20,
  ),
  Exercise(
    name: 'Running',
    imagePath: 'assets/images/running.png',
    duration: '10 minutes',
    exerciseCount: 0,
  ),
  Exercise(
    name: 'Stretching 1',
    imagePath: 'assets/images/str1.png',
    duration: '2 minutes',
    exerciseCount: 0,
  ),
  Exercise(
    name: 'Stretching 2',
    imagePath: 'assets/images/str2.png',
    duration: '2 minutes',
    exerciseCount: 0,
  ),
  Exercise(
    name: 'Crunch',
    imagePath: 'assets/images/crunch.png',
    duration: '20 times',
    exerciseCount: 20,
  ),
];