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
    <div className="p-3 pb-4 animate-fade-in">
      {/* Welcome section */}
      <section className="mb-6 animate-scale-in">
        <div className="relative overflow-hidden rounded-xl p-4 sm:p-6 border border-white/15 bg-gradient-to-br from-[var(--color-primary)]/25 via-[var(--color-primary)]/10 to-transparent shadow-lg">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-[var(--color-primary)]/20 blur-3xl animate-pulse" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-[var(--color-primary-light)]/15 blur-2xl" />
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold heading-gradient mb-1.5">
              {isAuthenticated ? `Hey ${user.name}!` : 'Welcome! 👋'}
            </h1>
            <p className="text-white/80 text-sm sm:text-base mb-4">
              {workoutHistory.length > 0
                ? `You've completed ${workoutHistory.length} workout${workoutHistory.length > 1 ? 's' : ''}. Keep crushing it! 💪`
                : "Ready to start your fitness journey? Let's do this! 🚀"}
            </p>
            <Link
              to="/workout-builder"
              className="inline-flex items-center gap-2 btn btn-primary hover:gap-3 transition-all duration-300 text-sm py-2.5 px-4"
            >
              Start Workout
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>



      {/* Muscle groups */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Target Muscle Groups</h2>
          <span className="text-[10px] text-white/60 font-medium">Choose your focus</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger-children">
          {muscleGroups.map((group) => (
            <Link
              key={group.id}
              to={`/workout-builder?muscle=${group.id}`}
              className={`group relative bg-gradient-to-br ${group.color} rounded-xl p-3.5 hover:scale-105 transition-all duration-300 active:scale-95 border border-white/20 shadow-lg hover:shadow-xl overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <span className="text-2xl mb-2 block transform group-hover:scale-110 transition-transform duration-300">{group.icon}</span>
                <span className="font-semibold text-sm block text-white drop-shadow-lg">{group.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent workouts */}
      {workoutHistory.length > 0 && (
        <section className="animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Recent Workouts</h2>
            <Link to="/history" className="text-[var(--color-primary-light)] text-xs font-medium hover:text-[var(--color-primary)] transition-colors flex items-center gap-1">
              View all
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="space-y-3">
            {workoutHistory.slice(0, 3).map((workout, index) => (
              <div key={index} className="card p-3.5 hover:border-white/20 group">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-base mb-0.5 group-hover:text-[var(--color-primary-light)] transition-colors">{workout.name || 'Workout'}</h3>
                    <span className="text-white/50 text-[10px]">
                      {new Date(workout.startTime).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  {workout.rating && (
                    <div className="flex items-center gap-1 bg-gradient-to-br from-[var(--color-success)]/20 to-[var(--color-success)]/10 px-2 py-1 rounded-full border border-[var(--color-success)]/30">
                      <svg className="w-3 h-3 text-[var(--color-success)]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold text-xs text-[var(--color-success)]">{workout.rating}/10</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="chip chip-primary text-[10px] py-1 px-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDuration(workout.duration)}
                  </span>
                  <span className="chip text-[10px] py-1 px-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {workout.stats?.totalReps || 0} reps
                  </span>
                  {workout.stats?.goodFormCount > 0 && (
                    <span className="chip chip-success text-[10px] py-1 px-2">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Good form
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Guest mode notice */}
      {!isAuthenticated && (
        <section className="mt-6 animate-slide-up">
          <div className="card p-3.5 border-[var(--color-warning)]/30 bg-gradient-to-br from-[var(--color-warning)]/10 to-transparent">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--color-warning)]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[var(--color-warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1 text-white">Guest Mode</h3>
                <p className="text-xs text-white/70 mb-2">
                  Create an account to save your progress!
                </p>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1 text-[var(--color-primary-light)] text-xs font-semibold hover:text-[var(--color-primary)] transition-colors"
                >
                  Sign up or Log in
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
