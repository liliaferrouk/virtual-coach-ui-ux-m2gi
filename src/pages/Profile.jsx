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
  const totalSeconds = workoutHistory.reduce((sum, w) => sum + (w.duration || 0), 0)

  const formatDuration = (total) => {
    if (!total || isNaN(total)) return '00:00'
    const mins = Math.floor(total / 60)
    const secs = total % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 pb-8 animate-fade-in">
        <div className="mb-8 text-center animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold heading-gradient mb-2">{isLogin ? 'Welcome Back!' : 'Join Us!'}</h1>
          <p className="text-white/70">
            {isLogin
              ? 'Log in to access your data and continue your journey'
              : 'Create an account to save your progress and unlock features'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {!isLogin && (
            <div className="animate-slide-up">
              <label className="block text-sm font-medium text-white/80 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3.5 card focus:border-[var(--color-primary-light)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                placeholder="Your name"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3.5 card focus:border-[var(--color-primary-light)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3.5 card focus:border-[var(--color-primary-light)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 animate-scale-in">
              <p className="text-[var(--color-accent)] text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}

          <button type="submit" className="w-full py-4 btn btn-primary text-base font-bold">
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-white/70">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[var(--color-primary-light)] font-semibold hover:text-[var(--color-primary)] transition-colors"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>

        <div className="mt-8 card p-5 border-[var(--color-primary)]/30">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-[var(--color-primary-light)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-white/70">
              You can use the app without an account, but your data will only be saved locally on this device.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-8 animate-fade-in">
      <h1 className="text-3xl font-bold heading-gradient mb-6">Profile</h1>

      {/* User info */}
      <div className="card p-6 mb-6 animate-scale-in">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold">{user.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg mb-1">{user.name}</p>
            <p className="text-sm text-white/60">{user.email}</p>
          </div>
          <div className="chip chip-success">
            Active
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Your Stats</h2>
        <div className="grid grid-cols-3 gap-4 stagger-children">
          <div className="card p-5 text-center group hover:scale-105">
            <svg className="w-8 h-8 mx-auto mb-2 text-[var(--color-primary-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <p className="text-3xl font-bold bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] bg-clip-text text-transparent mb-1">
              {workoutHistory.length}
            </p>
            <p className="text-xs text-white/60 font-medium">Workouts</p>
          </div>
          <div className="card p-5 text-center group hover:scale-105">
            <svg className="w-8 h-8 mx-auto mb-2 text-[var(--color-primary-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-3xl font-bold bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] bg-clip-text text-transparent mb-1">
              {totalReps}
            </p>
            <p className="text-xs text-white/60 font-medium">Total Reps</p>
          </div>
          <div className="card p-5 text-center group hover:scale-105">
            <svg className="w-8 h-8 mx-auto mb-2 text-[var(--color-primary-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-3xl font-bold bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] bg-clip-text text-transparent mb-1">
              {formatDuration(totalSeconds)}
            </p>
            <p className="text-xs text-white/60 font-medium">Time</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Fitness Level</h2>
        <div className="flex gap-3">
          {['beginner', 'intermediate', 'advanced'].map((level) => (
            <button
              key={level}
              onClick={() => updatePreferences({ fitnessLevel: level })}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all duration-300 ${
                userPreferences.fitnessLevel === level
                  ? 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] scale-105 shadow-lg'
                  : 'bg-white/10 hover:bg-white/15 border border-white/10'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={logout} 
        className="w-full py-4 btn btn-outline text-[var(--color-accent)] border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 group"
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </span>
      </button>
    </div>
  )
}
