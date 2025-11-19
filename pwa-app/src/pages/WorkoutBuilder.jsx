import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWorkout } from '../context/WorkoutContext'

const EXERCISES = {
  chest: [
    { id: 'pushups', name: 'Push-ups', reps: 15, hasTracking: true },
    { id: 'chest-press', name: 'Chest Press', reps: 12, hasTracking: false },
    { id: 'chest-fly', name: 'Chest Fly', reps: 12, hasTracking: false },
  ],
  back: [
    { id: 'rows', name: 'Rows', reps: 12, hasTracking: false },
    { id: 'lat-pulldown', name: 'Lat Pulldown', reps: 12, hasTracking: false },
  ],
  legs: [
    { id: 'squats', name: 'Squats', reps: 20, hasTracking: true },
    { id: 'lunges', name: 'Lunges', reps: 12, hasTracking: true },
    { id: 'calf-raises', name: 'Calf Raises', reps: 20, hasTracking: false },
  ],
  arms: [
    { id: 'bicep-curls', name: 'Bicep Curls', reps: 12, hasTracking: false },
    { id: 'tricep-dips', name: 'Tricep Dips', reps: 12, hasTracking: true },
  ],
  core: [
    { id: 'crunches', name: 'Crunches', reps: 20, hasTracking: true },
    { id: 'plank', name: 'Plank', reps: 30, hasTracking: true },
    { id: 'russian-twists', name: 'Russian Twists', reps: 20, hasTracking: false },
  ],
  cardio: [
    { id: 'jumping-jacks', name: 'Jumping Jacks', reps: 30, hasTracking: true },
    { id: 'burpees', name: 'Burpees', reps: 10, hasTracking: true },
    { id: 'high-knees', name: 'High Knees', reps: 30, hasTracking: true },
  ],
}

const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Chest', icon: '💪' },
  { id: 'back', name: 'Back', icon: '🔙' },
  { id: 'legs', name: 'Legs', icon: '🦵' },
  { id: 'arms', name: 'Arms', icon: '💪' },
  { id: 'core', name: 'Core', icon: '🎯' },
  { id: 'cardio', name: 'Cardio', icon: '❤️' },
]

export default function WorkoutBuilder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { startWorkout, userPreferences } = useWorkout()

  const initialMuscle = searchParams.get('muscle')
  const [selectedMuscles, setSelectedMuscles] = useState(
    initialMuscle ? [initialMuscle] : []
  )
  const [selectedExercises, setSelectedExercises] = useState([])
  const [step, setStep] = useState(1)

  const toggleMuscle = (muscleId) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscleId)
        ? prev.filter((id) => id !== muscleId)
        : [...prev, muscleId]
    )
  }

  const toggleExercise = (exercise, muscleId) => {
    setSelectedExercises((prev) => {
      const exists = prev.find((e) => e.id === exercise.id)
      if (exists) {
        return prev.filter((e) => e.id !== exercise.id)
      }
      return [...prev, { ...exercise, muscleGroup: muscleId }]
    })
  }

  const updateExerciseReps = (exerciseId, reps) => {
    setSelectedExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, reps: Math.max(1, reps) } : e))
    )
  }

  const handleStartWorkout = () => {
    const workout = {
      name: `${selectedMuscles.map(m => MUSCLE_GROUPS.find(g => g.id === m)?.name).join(' + ')} Workout`,
      exercises: selectedExercises,
      targetMuscles: selectedMuscles,
    }
    startWorkout(workout)
    navigate('/active-workout')
  }

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-[var(--color-primary)]' : 'bg-white/20'}`} />
        <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-[var(--color-primary)]' : 'bg-white/20'}`} />
        <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-[var(--color-primary)]' : 'bg-white/20'}`} />
      </div>

      {step === 1 && (
        <>
          <h1 className="text-2xl font-bold mb-2">Select Muscle Groups</h1>
          <p className="text-white/60 mb-6">Choose which areas you want to train</p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group.id}
                onClick={() => toggleMuscle(group.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedMuscles.includes(group.id)
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/20'
                    : 'border-white/10 bg-[var(--color-bg-card)]'
                }`}
              >
                <span className="text-2xl mb-2 block">{group.icon}</span>
                <span className="font-medium">{group.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={selectedMuscles.length === 0}
            className="w-full py-4 rounded-xl bg-[var(--color-primary)] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Continue
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setStep(1)} className="text-white/60">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Select Exercises</h1>
              <p className="text-white/60 text-sm">Choose exercises for your workout</p>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            {selectedMuscles.map((muscleId) => (
              <div key={muscleId}>
                <h3 className="font-semibold mb-3 capitalize">{muscleId}</h3>
                <div className="space-y-2">
                  {EXERCISES[muscleId]?.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => toggleExercise(exercise, muscleId)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedExercises.find((e) => e.id === exercise.id)
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/20'
                          : 'border-white/10 bg-[var(--color-bg-card)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{exercise.name}</span>
                        {exercise.hasTracking && (
                          <span className="text-xs px-2 py-1 bg-[var(--color-primary)]/30 rounded-full">
                            AI Tracking
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-white/60">{exercise.reps} reps</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={selectedExercises.length === 0}
            className="w-full py-4 rounded-xl bg-[var(--color-primary)] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Continue ({selectedExercises.length} exercises)
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setStep(2)} className="text-white/60">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Review Workout</h1>
              <p className="text-white/60 text-sm">Adjust reps and start training</p>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {selectedExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{exercise.name}</span>
                  {exercise.hasTracking && (
                    <span className="text-xs px-2 py-1 bg-[var(--color-primary)]/30 rounded-full">
                      AI
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateExerciseReps(exercise.id, exercise.reps - 1)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-12 text-center">{exercise.reps}</span>
                  <button
                    onClick={() => updateExerciseReps(exercise.id, exercise.reps + 1)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    +
                  </button>
                  <span className="text-sm text-white/60 ml-2">reps</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartWorkout}
            className="w-full py-4 rounded-xl bg-[var(--color-primary)] font-semibold"
          >
            Start Workout
          </button>
        </>
      )}
    </div>
  )
}
