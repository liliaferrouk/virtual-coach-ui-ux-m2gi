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
    { id: 'plank', name: 'Plank', reps: 30, hasTracking: true, unit: 'seconds' },
    { id: 'russian-twists', name: 'Russian Twists', reps: 20, hasTracking: false },
  ],
  cardio: [
    { id: 'jumping-jacks', name: 'Jumping Jacks', reps: 30, hasTracking: true },
    { id: 'burpees', name: 'Burpees', reps: 10, hasTracking: false },
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
    <div className="p-3 pb-4 animate-fade-in">
      {/* Progress indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] shadow-[var(--shadow-glow)]' : 'bg-white/20'}`} />
        <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] shadow-[var(--shadow-glow)]' : 'bg-white/20'}`} />
        <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] shadow-[var(--shadow-glow)]' : 'bg-white/20'}`} />
      </div>

      {step === 1 && (
        <div className="animate-scale-in">
          <h1 className="text-2xl font-bold heading-gradient mb-1.5">Select Muscle Groups</h1>
          <p className="text-white/70 text-sm mb-6">Choose which areas you want to train today</p>

          <div className="grid grid-cols-2 gap-3 mb-6 stagger-children">
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group.id}
                onClick={() => toggleMuscle(group.id)}
                className={`group relative p-3.5 rounded-xl border-2 transition-all duration-300 ${
                  selectedMuscles.includes(group.id)
                    ? 'border-[var(--color-primary-light)] bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-primary-light)]/10 scale-105 shadow-lg'
                    : 'border-white/10 bg-[var(--color-bg-card)] hover:border-white/20 hover:bg-white/5'
                }`}
              >
                {selectedMuscles.includes(group.id) && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-full flex items-center justify-center animate-scale-in">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <span className="text-2xl mb-2 block transform group-hover:scale-110 transition-transform duration-300">{group.icon}</span>
                <span className="font-semibold text-sm">{group.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={selectedMuscles.length === 0}
            className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 btn btn-primary"
          >
            Continue {selectedMuscles.length > 0 && `(${selectedMuscles.length} selected)`}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="animate-scale-in">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setStep(1)} 
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:scale-105 border border-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold heading-gradient">Select Exercises</h1>
              <p className="text-white/70 text-sm">Choose exercises for your workout</p>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            {selectedMuscles.map((muscleId, idx) => (
              <div key={muscleId} className="animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{MUSCLE_GROUPS.find(g => g.id === muscleId)?.icon}</span>
                  <h3 className="font-bold text-lg capitalize">{muscleId}</h3>
                </div>
                <div className="space-y-3">
                  {EXERCISES[muscleId]?.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => toggleExercise(exercise, muscleId)}
                      className={`group w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        selectedExercises.find((e) => e.id === exercise.id)
                          ? 'border-[var(--color-primary-light)] bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary-light)]/10 scale-[1.02] shadow-lg'
                          : 'border-white/10 bg-[var(--color-bg-card)] hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-base">{exercise.name}</span>
                        {exercise.hasTracking && (
                          <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-[var(--color-primary)]/30 to-[var(--color-primary-light)]/30 rounded-full border border-[var(--color-primary)]/40 font-medium">
                            🤖 AI Tracking
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/70 font-medium">{exercise.reps} {exercise.unit === 'seconds' ? 'seconds' : 'reps'}</span>
                        {selectedExercises.find((e) => e.id === exercise.id) && (
                          <div className="ml-auto w-5 h-5 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-full flex items-center justify-center animate-scale-in">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={selectedExercises.length === 0}
            className="w-full py-4 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 btn btn-primary"
          >
            Continue {selectedExercises.length > 0 && `(${selectedExercises.length} exercises)`}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="animate-scale-in">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => setStep(2)} 
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold heading-gradient">Review Workout</h1>
              <p className="text-white/70 text-xs">Adjust reps and start</p>
            </div>
          </div>

          <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-[var(--color-primary)]/20 to-transparent border border-[var(--color-primary)]/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80">Total Exercises</span>
              <span className="font-bold text-base text-[var(--color-primary-light)]">{selectedExercises.length}</span>
            </div>
          </div>

          <div className="space-y-2.5 mb-6 stagger-children">
            {selectedExercises.map((exercise, idx) => (
              <div
                key={exercise.id}
                className="card p-5 group hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="font-semibold text-base block mb-1">{exercise.name}</span>
                    {exercise.hasTracking && (
                      <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-[var(--color-primary)]/30 to-[var(--color-primary-light)]/30 rounded-full border border-[var(--color-primary)]/40 inline-block">
                        🤖 AI Tracking
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-white/50 font-medium">#{idx + 1}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => updateExerciseReps(exercise.id, exercise.reps - 1)}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/10"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                    </svg>
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] bg-clip-text text-transparent">
                      {exercise.reps}
                    </div>
                    <span className="text-xs text-white/60 font-medium">{exercise.unit === 'seconds' ? 'seconds' : 'reps'}</span>
                  </div>
                  <button
                    onClick={() => updateExerciseReps(exercise.id, exercise.reps + 1)}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/10"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartWorkout}
            className="w-full py-5 rounded-xl font-bold text-lg btn btn-primary group"
          >
            <span className="flex items-center justify-center gap-2">
              Start Workout
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
