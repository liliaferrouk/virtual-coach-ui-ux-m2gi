import 'package:flutter/material.dart';
import '../models/workout.dart';

class WorkoutDetailScreen extends StatelessWidget {
  final Workout workout;

  const WorkoutDetailScreen({
    super.key,
    required this.workout,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            backgroundColor: Theme.of(context).colorScheme.primary,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                workout.name,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Theme.of(context).colorScheme.primary,
                      Theme.of(context).colorScheme.secondary,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Center(
                  child: Icon(
                    _getWorkoutIcon(workout.category),
                    size: 100,
                    color: Colors.white.withOpacity(0.3),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Stats Cards
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          context,
                          Icons.fitness_center,
                          '${workout.exerciseCount}',
                          'Exercises',
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildStatCard(
                          context,
                          Icons.access_time,
                          '${workout.durationMinutes}',
                          'Minutes',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Description
                  Text(
                    'Description',
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          fontSize: 22,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    workout.description,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Exercise List
                  Text(
                    'Exercises',
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          fontSize: 22,
                        ),
                  ),
                  const SizedBox(height: 16),

                  ..._buildExerciseList(workout),

                  const SizedBox(height: 32),

                  // Start Workout Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        _showStartWorkoutDialog(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: const Text(
                        'Start Workout',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    IconData icon,
    String value,
    String label,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary, size: 32),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white54,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildExerciseList(Workout workout) {
    final exercises = _getExercisesForWorkout(workout);
    return exercises.asMap().entries.map((entry) {
      final index = entry.key;
      final exercise = entry.value;
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  '${index + 1}',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    exercise['name']!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    exercise['details']!,
                    style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  List<Map<String, String>> _getExercisesForWorkout(Workout workout) {
    switch (workout.category) {
      case WorkoutCategory.arms:
        return [
          {'name': 'Push-ups', 'details': '3 sets x 12 reps'},
          {'name': 'Bicep Curls', 'details': '3 sets x 15 reps'},
          {'name': 'Tricep Dips', 'details': '3 sets x 10 reps'},
          {'name': 'Shoulder Press', 'details': '3 sets x 12 reps'},
          {'name': 'Lateral Raises', 'details': '3 sets x 15 reps'},
        ];
      case WorkoutCategory.cardio:
        return [
          {'name': 'Jumping Jacks', 'details': '3 sets x 30 seconds'},
          {'name': 'High Knees', 'details': '3 sets x 30 seconds'},
          {'name': 'Burpees', 'details': '3 sets x 10 reps'},
          {'name': 'Mountain Climbers', 'details': '3 sets x 30 seconds'},
        ];
      case WorkoutCategory.thighs:
        return [
          {'name': 'Squats', 'details': '4 sets x 15 reps'},
          {'name': 'Lunges', 'details': '3 sets x 12 reps each leg'},
          {'name': 'Leg Press', 'details': '3 sets x 15 reps'},
          {'name': 'Wall Sits', 'details': '3 sets x 45 seconds'},
        ];
      case WorkoutCategory.butt:
        return [
          {'name': 'Glute Bridges', 'details': '4 sets x 15 reps'},
          {'name': 'Donkey Kicks', 'details': '3 sets x 15 reps each leg'},
          {'name': 'Fire Hydrants', 'details': '3 sets x 12 reps each leg'},
          {'name': 'Bulgarian Split Squats', 'details': '3 sets x 10 reps each leg'},
        ];
      case WorkoutCategory.abs:
        return [
          {'name': 'Crunches', 'details': '3 sets x 20 reps'},
          {'name': 'Planks', 'details': '3 sets x 60 seconds'},
          {'name': 'Russian Twists', 'details': '3 sets x 20 reps'},
          {'name': 'Leg Raises', 'details': '3 sets x 15 reps'},
        ];
      case WorkoutCategory.fullBody:
        return [
          {'name': 'Burpees', 'details': '3 sets x 10 reps'},
          {'name': 'Push-ups', 'details': '3 sets x 15 reps'},
          {'name': 'Squats', 'details': '3 sets x 20 reps'},
          {'name': 'Planks', 'details': '3 sets x 60 seconds'},
          {'name': 'Jumping Jacks', 'details': '3 sets x 30 seconds'},
          {'name': 'Lunges', 'details': '3 sets x 12 reps each leg'},
        ];
    }
  }

  IconData _getWorkoutIcon(WorkoutCategory category) {
    switch (category) {
      case WorkoutCategory.arms:
        return Icons.fitness_center;
      case WorkoutCategory.cardio:
        return Icons.favorite;
      case WorkoutCategory.thighs:
        return Icons.directions_run;
      case WorkoutCategory.butt:
        return Icons.accessibility_new;
      case WorkoutCategory.abs:
        return Icons.sports_gymnastics;
      case WorkoutCategory.fullBody:
        return Icons.self_improvement;
    }
  }

  void _showStartWorkoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Theme.of(context).colorScheme.surface,
        title: const Text(
          'Ready to Start?',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'You are about to start a ${workout.durationMinutes}-minute ${workout.name} workout with ${workout.exerciseCount} exercises.',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Starting ${workout.name} workout!'),
                  backgroundColor: Theme.of(context).colorScheme.primary,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.primary,
            ),
            child: const Text('Start Now'),
          ),
        ],
      ),
    );
  }
}
