import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useWorkout } from '../context/WorkoutContext'

export default function Profile() {
  const { user, isAuthenticated, login, signup, logout } = useAuth()
  const { userPreferences, updatePreferences, workoutHistory } = useWorkout()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      if (isLogin) {
        await login(formData.email, formData.password)
      } else {
        await signup(formData.email, formData.password, formData.name)
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    }
  }

  const totalReps = workoutHistory.reduce((sum, w) => sum + (w.stats?.totalReps || 0), 0)
  const totalMinutes = workoutHistory.reduce((sum, w) => sum + (w.duration || 0), 0)

  if (!isAuthenticated) {
    return (
      <div className="p-4 pb-8 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">{isLogin ? 'Log In' : 'Sign Up'}</h1>
        <p className="text-white/60 mb-6">
          {isLogin
            ? 'Welcome back! Log in to access your data.'
            : 'Create an account to save your progress.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {!isLogin && (
            <div>
              <label className="block text-sm text-white/60 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--color-bg-card)] border border-white/10 rounded-xl focus:border-[var(--color-primary)] outline-none"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-white/60 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--color-bg-card)] border border-white/10 rounded-xl focus:border-[var(--color-primary)] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--color-bg-card)] border border-white/10 rounded-xl focus:border-[var(--color-primary)] outline-none"
              required
            />
          </div>

          {error && (
            <p className="text-[var(--color-accent)] text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-[var(--color-primary)] font-semibold"
          >
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-white/60">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[var(--color-primary)]"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>

        <div className="mt-8 p-4 bg-[var(--color-bg-card)] rounded-xl border border-white/10">
          <p className="text-sm text-white/60">
            You can use the app without an account, but your data will only be saved locally on this device.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {/* User info */}
      <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-white/10 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
            <span className="text-xl font-bold">{user.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-white/60">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[var(--color-bg-card)] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{workoutHistory.length}</p>
          <p className="text-xs text-white/60">Workouts</p>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{totalReps}</p>
          <p className="text-xs text-white/60">Total Reps</p>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{totalMinutes}</p>
          <p className="text-xs text-white/60">Minutes</p>
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-6">
        <h2 className="font-semibold mb-3">Fitness Level</h2>
        <div className="flex gap-2">
          {['beginner', 'intermediate', 'advanced'].map((level) => (
            <button
              key={level}
              onClick={() => updatePreferences({ fitnessLevel: level })}
              className={`flex-1 py-2 rounded-lg text-sm capitalize ${
                userPreferences.fitnessLevel === level
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-white/10'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full py-3 rounded-xl border border-[var(--color-accent)] text-[var(--color-accent)]"
      >
        Log Out
      </button>
    </div>
  )
}
