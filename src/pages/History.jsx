import { useWorkout } from "../context/WorkoutContext";

export default function History() {
  const { workoutHistory } = useWorkout();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // --- NOUVELLE FONCTION DE FORMATAGE ---
  const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return "00:00";
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getFormPercentage = (stats) => {
    if (!stats || stats.totalReps === 0) return 0;
    return Math.round((stats.goodFormCount / stats.totalReps) * 100);
  };

  return (
    <div className="p-4 pb-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-2">Workout History</h1>
      <p className="text-white/60 mb-6">
        {workoutHistory.length} workout{workoutHistory.length !== 1 ? "s" : ""}{" "}
        completed
      </p>

      {workoutHistory.length === 0 ? (
        <div className="text-center py-12">
          {/* ... contenu vide inchangé ... */}
          <p className="text-white/60 mb-2">No workouts yet</p>
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
                  <h3 className="font-semibold">{workout.name || "Workout"}</h3>
                  <p className="text-sm text-white/60">
                    {formatDate(workout.startTime)}
                  </p>
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
                  {/* --- UTILISATION DU NOUVEAU FORMAT --- */}
                  <p className="font-semibold">
                    {formatDuration(workout.duration)}
                  </p>
                  <p className="text-xs text-white/60">time</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="font-semibold">
                    {workout.stats?.totalReps || 0}
                  </p>
                  <p className="text-xs text-white/60">reps</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="font-semibold text-[var(--color-success)]">
                    {getFormPercentage(workout.stats)}%
                  </p>
                  <p className="text-xs text-white/60">form</p>
                </div>
              </div>

              {/* ... reste de l'affichage des exercices ... */}
              <div className="mt-3 pt-3 border-t border-white/10">
                {/* ... code existant pour la liste des exercices ... */}
                {workout.exercises?.map((exercise, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-white/10 rounded-full mr-1"
                  >
                    {exercise.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
