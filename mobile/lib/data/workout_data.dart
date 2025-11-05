import '../models/workout.dart';

class WorkoutData {
  static List<Workout> getAllWorkouts() {
    return [
      Workout(
        id: '1',
        name: 'Arms',
        description: 'Strengthen and tone your arm muscles with targeted exercises',
        exerciseCount: 30,
        durationMinutes: 45,
        category: WorkoutCategory.arms,
      ),
      Workout(
        id: '2',
        name: 'Cardio',
        description: 'Boost your cardiovascular health and burn calories',
        exerciseCount: 19,
        durationMinutes: 30,
        category: WorkoutCategory.cardio,
      ),
      Workout(
        id: '3',
        name: 'Thighs',
        description: 'Target your leg muscles for stronger, toned thighs',
        exerciseCount: 25,
        durationMinutes: 40,
        category: WorkoutCategory.thighs,
      ),
      Workout(
        id: '4',
        name: 'Butt',
        description: 'Sculpt and strengthen your glutes',
        exerciseCount: 19,
        durationMinutes: 30,
        category: WorkoutCategory.butt,
      ),
      Workout(
        id: '5',
        name: 'Abs',
        description: 'Core strengthening exercises for a toned midsection',
        exerciseCount: 22,
        durationMinutes: 25,
        category: WorkoutCategory.abs,
      ),
      Workout(
        id: '6',
        name: 'Full Body',
        description: 'Complete workout targeting all major muscle groups',
        exerciseCount: 35,
        durationMinutes: 60,
        category: WorkoutCategory.fullBody,
      ),
    ];
  }
}
