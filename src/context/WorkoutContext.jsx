import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const WorkoutContext = createContext(null);

export function WorkoutProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [userPreferences, setUserPreferences] = useState({
    fitnessLevel: "beginner", // beginner, intermediate, advanced
    goals: [], // weight-loss, muscle-gain, flexibility, endurance
    availableEquipment: [], // dumbbells, barbell, resistance-bands, none
    preferredDuration: 30, // minutes
    targetMuscles: [],
  });

  // Load data from localStorage
  useEffect(() => {
    const storageKey = isAuthenticated
      ? `vcoach_data_${user.id}`
      : "vcoach_data_guest";
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      const data = JSON.parse(savedData);
      setWorkoutHistory(data.history || []);
      setUserPreferences((prev) => ({ ...prev, ...data.preferences }));
    }
  }, [user, isAuthenticated]);

  // Save data to localStorage
  const saveData = () => {
    const storageKey = isAuthenticated
      ? `vcoach_data_${user.id}`
      : "vcoach_data_guest";
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        history: workoutHistory,
        preferences: userPreferences,
      })
    );
  };

  useEffect(() => {
    if (workoutHistory.length > 0 || Object.keys(userPreferences).length > 0) {
      saveData();
    }
  }, [workoutHistory, userPreferences]);

  const startWorkout = (workout) => {
    setCurrentWorkout({
      ...workout,
      startTime: new Date().toISOString(),
      completedExercises: [],
      stats: {
        totalReps: 0,
        goodFormCount: 0,
        badFormCount: 0,
      },
    });
  };

  const updateExerciseProgress = (exerciseId, stats) => {
    setCurrentWorkout((prev) => ({
      ...prev,
      completedExercises: [
        ...prev.completedExercises,
        { exerciseId, ...stats },
      ],
      stats: {
        totalReps: prev.stats.totalReps + (stats.reps || 0),
        goodFormCount: prev.stats.goodFormCount + (stats.goodForm || 0),
        badFormCount: prev.stats.badFormCount + (stats.badForm || 0),
      },
    }));
  };

  const finishWorkout = (
    rating,
    notes = "",
    customDurationInSeconds = null
  ) => {
    if (!currentWorkout) return null;

    let durationInSeconds;

    if (customDurationInSeconds !== null) {
      // On utilise la valeur exacte envoyée par ActiveWorkout
      durationInSeconds = customDurationInSeconds;
    } else {
      // Calcul de secours
      const startTime = new Date(currentWorkout.startTime);
      const endTime = new Date();
      durationInSeconds = Math.floor((endTime - startTime) / 1000);
    }

    const completedWorkout = {
      ...currentWorkout,
      endTime: new Date().toISOString(),
      rating,
      notes,
      duration: durationInSeconds, // On sauvegarde les secondes exactes
    };

    setWorkoutHistory((prev) => [completedWorkout, ...prev]);
    setCurrentWorkout(null);

    return completedWorkout;
  };

  const cancelWorkout = () => {
    setCurrentWorkout(null);
  };

  const updatePreferences = (newPreferences) => {
    setUserPreferences((prev) => ({ ...prev, ...newPreferences }));
  };

  const value = {
    currentWorkout,
    workoutHistory,
    userPreferences,
    startWorkout,
    updateExerciseProgress,
    finishWorkout,
    cancelWorkout,
    updatePreferences,
  };

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}
