import { useWorkout } from '../context/WorkoutContext'

export default function History() {
  const { workoutHistory } = useWorkout()

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFormPercentage = (stats) => {
    if (!stats || stats.totalReps === 0) return 0
    return Math.round((stats.goodFormCount / stats.totalReps) * 100)
  }

  return (
    <div className="p-4 pb-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-2">Workout History</h1>
      <p className="text-white/60 mb-6">
        {workoutHistory.length} workout{workoutHistory.length !== 1 ? 's' : ''} completed
      </p>

      {workoutHistory.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-white/60 mb-2">No workouts yet</p>
          <p className="text-sm text-white/40">Complete your first workout to see it here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workoutHistory.map((workout, index) => (
            <div
              key={index}
              className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{workout.name || 'Workout'}</h3>
                  <p className="text-sm text-white/60">{formatDate(workout.startTime)}</p>
                </div>
                {workout.rating && (
                  <div className="text-right">
                    <span className="text-lg font-bold text-[var(--color-primary)]">
                      {workout.rating}
                    </span>
                    <span className="text-sm text-white/60">/10</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="font-semibold">{workout.duration || 0}</p>
                  <p className="text-xs text-white/60">min</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="font-semibold">{workout.stats?.totalReps || 0}</p>
                  <p className="text-xs text-white/60">reps</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="font-semibold text-[var(--color-success)]">
                    {getFormPercentage(workout.stats)}%
                  </p>
                  <p className="text-xs text-white/60">form</p>
                </div>
              </div>

              {workout.completedExercises && workout.completedExercises.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-2">Exercises</p>
                  <div className="flex flex-wrap gap-1">
                    {workout.exercises?.map((exercise, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-white/10 rounded-full"
                      >
                        {exercise.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
