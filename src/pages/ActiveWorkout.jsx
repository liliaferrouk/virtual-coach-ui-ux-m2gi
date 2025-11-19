import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkout } from '../context/WorkoutContext'
import PoseDetection from '../components/PoseDetection'

export default function ActiveWorkout() {
  const navigate = useNavigate()
  const { currentWorkout, updateExerciseProgress, finishWorkout, cancelWorkout } = useWorkout()
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [exerciseStats, setExerciseStats] = useState({
    reps: 0,
    goodForm: 0,
    badForm: 0
  })
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(5)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Redirect if no workout
  useEffect(() => {
    if (!currentWorkout) {
      navigate('/workout-builder')
    }
  }, [currentWorkout, navigate])

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!currentWorkout) return null

  const currentExercise = currentWorkout.exercises[currentExerciseIndex]
  const isLastExercise = currentExerciseIndex === currentWorkout.exercises.length - 1

  const handleExerciseComplete = () => {
    updateExerciseProgress(currentExercise.id, exerciseStats)

    if (isLastExercise) {
      setShowRating(true)
    } else {
      setCurrentExerciseIndex(prev => prev + 1)
      setExerciseStats({ reps: 0, goodForm: 0, badForm: 0 })
    }
  }

  const handleFinish = () => {
    finishWorkout(rating)
    navigate('/history')
  }

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this workout?')) {
      cancelWorkout()
      navigate('/')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formPercentage = exerciseStats.reps > 0
    ? Math.round((exerciseStats.goodForm / exerciseStats.reps) * 100)
    : 0

  if (showRating) {
    return (
      <div className="p-4 pb-8 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2 text-center">Workout Complete!</h1>
        <p className="text-white/60 text-center mb-8">
          Great job! How would you rate this session?
        </p>

        <div className="bg-[var(--color-bg-card)] rounded-xl p-6 mb-8">
          <div className="text-center mb-6">
            <span className="text-4xl font-bold">{rating}</span>
            <span className="text-white/60">/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[var(--color-bg-card)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
            <p className="text-sm text-white/60">Duration</p>
          </div>
          <div className="bg-[var(--color-bg-card)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{currentWorkout.exercises.length}</p>
            <p className="text-sm text-white/60">Exercises</p>
          </div>
        </div>

        <button
          onClick={handleFinish}
          className="w-full py-4 rounded-xl bg-[var(--color-primary)] font-semibold"
        >
          Save Workout
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-[var(--color-bg-dark)]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handleCancel} className="text-white/60">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="font-mono">{formatTime(elapsedTime)}</span>
          <span className="text-sm text-white/60">
            {currentExerciseIndex + 1}/{currentWorkout.exercises.length}
          </span>
        </div>

        <h2 className="text-xl font-bold text-center">{currentExercise.name}</h2>
        <p className="text-center text-white/60">Target: {currentExercise.reps} reps</p>
      </div>

      {/* Pose detection or manual counter */}
      <div className="flex-1 relative">
        {currentExercise.hasTracking ? (
          <PoseDetection
            exercise={currentExercise}
            onStatsUpdate={setExerciseStats}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <p className="text-6xl font-bold mb-4">{exerciseStats.reps}</p>
            <p className="text-white/60 mb-8">Manual count</p>
            <div className="flex gap-4">
              <button
                onClick={() => setExerciseStats(prev => ({
                  ...prev,
                  reps: Math.max(0, prev.reps - 1)
                }))}
                className="w-16 h-16 rounded-full bg-white/10 text-2xl"
              >
                -
              </button>
              <button
                onClick={() => setExerciseStats(prev => ({
                  ...prev,
                  reps: prev.reps + 1,
                  goodForm: prev.goodForm + 1
                }))}
                className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-2xl"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats and controls */}
      <div className="p-4 bg-[var(--color-bg-card)] border-t border-white/10">
        {currentExercise.hasTracking && (
          <div className="flex justify-around mb-4 text-center">
            <div>
              <p className="text-2xl font-bold">{exerciseStats.reps}</p>
              <p className="text-xs text-white/60">Reps</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-success)]">{formPercentage}%</p>
              <p className="text-xs text-white/60">Good Form</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-accent)]">{exerciseStats.badForm}</p>
              <p className="text-xs text-white/60">Bad Form</p>
            </div>
          </div>
        )}

        <button
          onClick={handleExerciseComplete}
          className="w-full py-4 rounded-xl bg-[var(--color-primary)] font-semibold"
        >
          {isLastExercise ? 'Finish Workout' : 'Next Exercise'}
        </button>
      </div>
    </div>
  )
}
