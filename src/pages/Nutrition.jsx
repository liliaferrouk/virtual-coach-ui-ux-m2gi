import { useWorkout } from '../context/WorkoutContext'

export default function Nutrition() {
  const { userPreferences, workoutHistory } = useWorkout()

  // Calculate suggested calories based on activity
  const weeklyWorkouts = workoutHistory.filter(w => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(w.startTime) > weekAgo
  }).length

  const activityLevel = weeklyWorkouts >= 5 ? 'high' : weeklyWorkouts >= 3 ? 'moderate' : 'low'

  const tips = {
    beginner: [
      'Start with 1.6g of protein per kg of body weight',
      'Stay hydrated - aim for 2-3 liters of water daily',
      'Eat complex carbs before workouts for energy',
      'Include vegetables in every meal for micronutrients',
      'Get 7-9 hours of sleep for optimal recovery'
    ],
    intermediate: [
      'Increase protein to 1.8-2g per kg for muscle growth',
      'Time your carbs around workouts for performance',
      'Consider creatine supplementation',
      'Track your macros to optimize results',
      'Include healthy fats for hormone production'
    ],
    advanced: [
      'Cycle your calories based on training days',
      'Fine-tune protein timing around workouts',
      'Periodize your nutrition with training phases',
      'Consider working with a sports nutritionist',
      'Monitor micronutrient intake for deficiencies'
    ]
  }

  const mealIdeas = [
    {
      type: 'Pre-workout',
      time: '1-2 hours before',
      options: ['Oatmeal with banana', 'Rice cakes with peanut butter', 'Greek yogurt with berries']
    },
    {
      type: 'Post-workout',
      time: 'Within 30 minutes',
      options: ['Protein shake with fruit', 'Chicken with rice', 'Cottage cheese with honey']
    },
    {
      type: 'Recovery',
      time: 'Evening meal',
      options: ['Salmon with vegetables', 'Lean beef with sweet potato', 'Eggs with avocado toast']
    }
  ]

  return (
    <div className="p-4 pb-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-2">Nutrition Tips</h1>
      <p className="text-white/60 mb-6">
        Personalized advice based on your {userPreferences.fitnessLevel} level
      </p>

      {/* Activity summary */}
      <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-white/10 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/60">This week's activity</span>
          <span className={`text-sm px-2 py-1 rounded-full ${
            activityLevel === 'high' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' :
            activityLevel === 'moderate' ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]' :
            'bg-white/10 text-white/60'
          }`}>
            {activityLevel.charAt(0).toUpperCase() + activityLevel.slice(1)}
          </span>
        </div>
        <p className="text-2xl font-bold">{weeklyWorkouts} workouts</p>
      </div>

      {/* Tips for level */}
      <section className="mb-6">
        <h2 className="font-semibold mb-3">Tips for {userPreferences.fitnessLevel}s</h2>
        <div className="space-y-2">
          {tips[userPreferences.fitnessLevel].map((tip, index) => (
            <div
              key={index}
              className="flex items-start gap-3 bg-[var(--color-bg-card)] rounded-lg p-3 border border-white/10"
            >
              <span className="text-[var(--color-primary)] mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-sm">{tip}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Meal ideas */}
      <section>
        <h2 className="font-semibold mb-3">Meal Ideas</h2>
        <div className="space-y-4">
          {mealIdeas.map((meal, index) => (
            <div
              key={index}
              className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{meal.type}</h3>
                <span className="text-xs text-white/40">{meal.time}</span>
              </div>
              <ul className="space-y-1">
                {meal.options.map((option, i) => (
                  <li key={i} className="text-sm text-white/80 flex items-center gap-2">
                    <span className="w-1 h-1 bg-[var(--color-primary)] rounded-full" />
                    {option}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
