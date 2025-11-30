import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWorkout } from '../context/WorkoutContext'

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const { workoutHistory } = useWorkout()

  const muscleGroups = [
    { id: 'chest', name: 'Chest', icon: '💪', color: 'from-red-500 to-orange-500' },
    { id: 'back', name: 'Back', icon: '🔙', color: 'from-blue-500 to-cyan-500' },
    { id: 'legs', name: 'Legs', icon: '🦵', color: 'from-green-500 to-emerald-500' },
    { id: 'arms', name: 'Arms', icon: '💪', color: 'from-purple-500 to-pink-500' },
    { id: 'core', name: 'Core', icon: '🎯', color: 'from-yellow-500 to-amber-500' },
    { id: 'cardio', name: 'Cardio', icon: '❤️', color: 'from-rose-500 to-red-500' },
  ]

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds)) return '00:00';
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Welcome section */}
      <section className="mb-8">
        <div className="relative overflow-hidden rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-[var(--color-primary)]/20 to-transparent">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-[var(--color-primary)]/15 blur-2xl" />
          <h1 className="text-2xl sm:text-3xl font-bold heading-gradient mb-1">
            {isAuthenticated ? `Hey ${user.name}!` : 'Welcome!'}
          </h1>
          <p className="text-white/70 mb-4">
            {workoutHistory.length > 0
              ? `You've completed ${workoutHistory.length} workout${workoutHistory.length > 1 ? 's' : ''}. Keep it up!`
              : "Ready to start your fitness journey?"}
          </p>
          <Link
            to="/workout-builder"
            className="inline-flex items-center gap-2 btn btn-primary ring-glow"
          >
            Start Workout
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Quick start */}
      <section className="mb-8">
        <Link
          to="/workout-builder"
          className="block w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-2xl p-6 hover:scale-[1.02] transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Start Workout</h2>
              <p className="text-white/80 text-sm">Create a personalized training plan</p>
            </div>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </Link>
      </section>

      {/* Muscle groups */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Target Muscle Groups</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {muscleGroups.map((group) => (
            <Link
              key={group.id}
              to={`/workout-builder?muscle=${group.id}`}
              className={`bg-gradient-to-br ${group.color} rounded-xl p-4 hover:scale-[1.03] transition-transform active:scale-[0.98] border border-white/10`}
            >
              <span className="text-2xl mb-2 block">{group.icon}</span>
              <span className="font-medium text-sm">{group.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent workouts */}
      {workoutHistory.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Workouts</h2>
            <Link to="/history" className="text-[var(--color-primary)] text-sm">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {workoutHistory.slice(0, 3).map((workout, index) => (
              <div key={index} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{workout.name || 'Workout'}</h3>
                  <span className="text-white/60 text-sm">
                    {new Date(workout.startTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80 flex-wrap">
                  <span className="chip">
                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="10"/></svg>
                    {formatDuration(workout.duration)}
                  </span>
                  <span className="chip">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M9 19V6l12-2v13"/></svg>
                    {workout.stats?.totalReps || 0} reps
                  </span>
                  {workout.rating && (
                    <span className="chip chip-success">{workout.rating}/10</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Guest mode notice */}
      {!isAuthenticated && (
        <section className="mt-8">
          <div className="card p-4">
            <p className="text-sm text-white/60 mb-3">
              You're using the app as a guest. Create an account to save your progress.
            </p>
            <Link
              to="/profile"
              className="text-[var(--color-primary)] text-sm font-medium"
            >
              Sign up or Log in
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
