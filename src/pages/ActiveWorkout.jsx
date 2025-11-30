import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkout } from "../context/WorkoutContext";
import PoseDetection from "../components/PoseDetection";

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const {
    currentWorkout,
    updateExerciseProgress,
    finishWorkout,
    cancelWorkout,
  } = useWorkout();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseStats, setExerciseStats] = useState({
    reps: 0,
    goodForm: 0,
    badForm: 0,
  });
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [sensitivity, setSensitivity] = useState('normal'); // 'lenient' | 'normal' | 'strict'
  const [isPaused, setIsPaused] = useState(false);
  const [resumeCountdown, setResumeCountdown] = useState(0);
  const [voiceCmdOn, setVoiceCmdOn] = useState(false);
  const [listeningActive, setListeningActive] = useState(false);
  const [lastVoiceCmd, setLastVoiceCmd] = useState("");
  const recognitionRef = useRef(null);
  const micStreamRef = useRef(null);
  const [micError, setMicError] = useState("");

  // Redirect if no workout
  useEffect(() => {
    if (!currentWorkout) {
      navigate("/workout-builder");
    }
  }, [currentWorkout, navigate]);

  // --- FIX 1: UPDATED TIMER LOGIC ---
  // Only run the timer if we are NOT showing the rating screen
  useEffect(() => {
    let timer;
    if (!showRating && !isPaused) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showRating, isPaused]);

  if (!currentWorkout) return null;

  const currentExercise = currentWorkout.exercises[currentExerciseIndex];
  const isLastExercise =
    currentExerciseIndex === currentWorkout.exercises.length - 1;
  const isTimed = currentExercise.unit === 'seconds' || currentExercise.id === 'plank';

  const handleExerciseComplete = () => {
    updateExerciseProgress(currentExercise.id, exerciseStats);

    if (isLastExercise) {
      setShowRating(true); // This will now trigger the useEffect to stop the timer
    } else {
      setCurrentExerciseIndex((prev) => prev + 1);
      setExerciseStats({ reps: 0, goodForm: 0, badForm: 0 });
    }
  };

  const handleFinish = () => {
    // On passe le temps exact (elapsedTime) en secondes
    finishWorkout(rating, "", elapsedTime);
    navigate("/history");
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel this workout?")) {
      cancelWorkout();
      navigate("/");
    }
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      // Start 3-2-1 countdown before resuming
      setResumeCountdown(3);
      const id = setInterval(() => {
        setResumeCountdown((c) => {
          if (c <= 1) {
            clearInterval(id);
            setIsPaused(false);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      setIsPaused(true);
    }
  };

  // Ensure microphone permission helper
  const ensureMicPermission = async () => {
    try {
      // Security check: mic requires HTTPS or localhost
      const host = window.location.hostname;
      const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host);
      if (!window.isSecureContext && !isLocalhost) {
        setMicError("Mic requires HTTPS or localhost.");
        return false;
      }
      if (!navigator.mediaDevices?.getUserMedia) return true; // best effort
      // If we already hold a stream, consider mic ready
      if (micStreamRef.current) return true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicError("");
      // We don't need to keep the stream for Web Speech; stop tracks to free mic
      setTimeout(() => { try { stream.getTracks().forEach(t => t.stop()); } catch (_) {} }, 0);
      micStreamRef.current = null;
      return true;
    } catch (e) {
      setMicError("Microphone blocked. Allow mic in browser site settings.");
      return false;
    }
  };

  // Toggle handler that requests mic permission and starts SR within user gesture
  const handleToggleVoiceCmd = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMicError("Voice commands not supported in this browser.");
      return;
    }
    if (!voiceCmdOn) {
      const ok = await ensureMicPermission();
      if (!ok) return; // don't enable if mic blocked
      if (!recognitionRef.current) {
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-US';
        // Bind minimal handlers before starting to satisfy Chrome
        rec.onstart = () => setListeningActive(true);
        rec.onend = () => { setListeningActive(false); if (voiceCmdOn) { try { rec.start(); } catch (_) {} } };
        rec.onerror = (e) => { setListeningActive(false); if (e?.error === 'not-allowed') setMicError('Microphone blocked. Allow mic in site settings.'); };
        recognitionRef.current = rec;
      }
      try { recognitionRef.current.start(); setListeningActive(true); } catch (_) {}
      setVoiceCmdOn(true);
    } else {
      try { recognitionRef.current && recognitionRef.current.stop(); } catch (_) {}
      setListeningActive(false);
      setVoiceCmdOn(false);
    }
  };

  // Voice commands (pause/resume/next/back/mute/sensitivity)
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    // Gracefully stop if disabled or unsupported
    if (!SR) {
      setListeningActive(false);
      return;
    }

    // Create recognition instance once
    if (!recognitionRef.current) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';
      recognitionRef.current = rec;
    }

    const rec = recognitionRef.current;

    // Always bind fresh handlers so they capture latest state
    rec.onresult = (event) => {
      const res = event.results[event.results.length - 1];
      if (!res || !res.isFinal) return;
      const transcript = (res[0]?.transcript || '').toLowerCase().trim();
      if (!transcript) return;
      setLastVoiceCmd(transcript);

      const has = (...alts) => alts.some(a => transcript.includes(a));
      if (has('pause', 'stop')) { if (!isPaused) setIsPaused(true); return; }
      if (has('resume', 'continue', 'go on', 'play')) {
        if (isPaused) {
          setResumeCountdown(3);
          const id = setInterval(() => {
            setResumeCountdown((c) => { if (c <= 1) { clearInterval(id); setIsPaused(false); return 0; } return c - 1; });
          }, 1000);
        }
        return;
      }
      if (has('cancel workout', 'end workout', 'exit workout', 'quit workout', 'cancel')) { handleCancel(); return; }
      if (has('next', 'skip')) { handleExerciseComplete(); return; }
      if (has('back', 'previous', 'go back')) {
        if (currentExerciseIndex > 0) {
          setCurrentExerciseIndex((i) => Math.max(0, i - 1));
          setExerciseStats({ reps: 0, goodForm: 0, badForm: 0 });
        }
        return;
      }
      if (has('mute', 'silent')) { setVoiceOn(false); return; }
      if (has('unmute', 'sound on', 'speak')) { setVoiceOn(true); return; }
      if (has('lenient', 'easy')) { setSensitivity('lenient'); return; }
      if (has('normal', 'medium', 'regular')) { setSensitivity('normal'); return; }
      if (has('strict', 'hard')) { setSensitivity('strict'); return; }
    };

    rec.onstart = () => setListeningActive(true);
    rec.onend = () => {
      setListeningActive(false);
      // Auto-restart only when voice commands are enabled
      if (voiceCmdOn) {
        try { rec.start(); } catch (_) {}
      }
    };
    rec.onerror = () => { setListeningActive(false); };

    // Start is handled in the click handler to keep a user gesture.
    // Stop here when disabled to ensure cleanup.
    if (!voiceCmdOn) {
      try { rec.stop(); } catch (_) {}
      setListeningActive(false);
    }

    return () => {
      try { rec.stop(); } catch (_) {}
      setListeningActive(false);
    };
  }, [voiceCmdOn, isPaused, currentExerciseIndex]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formPercentage =
    exerciseStats.reps > 0
      ? Math.round((exerciseStats.goodForm / exerciseStats.reps) * 100)
      : 0;

  if (showRating) {
    return (
      <div className="p-3 pb-4 animate-fade-in">
        <div className="text-center mb-6 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-[var(--color-success)]/30 to-[var(--color-success)]/10 flex items-center justify-center border-4 border-[var(--color-success)]/50">
            <svg className="w-8 h-8 text-[var(--color-success)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold heading-gradient mb-1.5">
            Workout Complete! 🎉
          </h1>
          <p className="text-white/70 text-sm">
            Great job! Rate this session
          </p>
        </div>

        <div className="card p-4 mb-4 border-[var(--color-primary)]/30">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {[...Array(10)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 transition-all duration-200 ${
                    i < rating ? 'text-[var(--color-warning)] scale-110' : 'text-white/20'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div className="mb-3">
              <span className="text-4xl font-bold bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-warning)]/70 bg-clip-text text-transparent">{rating}</span>
              <span className="text-white/60 text-xl">/10</span>
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value))}
            className="w-full accent-[var(--color-primary)] cursor-pointer"
            style={{
              height: '6px',
              background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${rating * 10}%, rgba(255,255,255,0.2) ${rating * 10}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card p-3.5 text-center group hover:scale-105">
            <svg className="w-6 h-6 mx-auto mb-1.5 text-[var(--color-primary-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-2xl font-bold mb-0.5">{formatTime(elapsedTime)}</p>
            <p className="text-[10px] text-white/60 font-medium">Duration</p>
          </div>
          <div className="card p-3.5 text-center group hover:scale-105">
            <svg className="w-6 h-6 mx-auto mb-1.5 text-[var(--color-primary-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-2xl font-bold mb-0.5">
              {currentWorkout.exercises.length}
            </p>
            <p className="text-[10px] text-white/60 font-medium">Exercises</p>
          </div>
        </div>

        <button
          onClick={handleFinish}
          className="w-full py-3 rounded-lg font-bold text-sm btn btn-primary group"
        >
          <span className="flex items-center justify-center gap-2">
            Save Workout
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      {/* Minimal Header - Just Cancel and Timer */}
      <div className="px-3 py-2 bg-gradient-to-b from-[var(--color-bg-dark)] to-transparent border-b border-white/10">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleCancel} 
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-red-500/20 flex items-center justify-center transition-all duration-300 border border-white/10 hover:border-red-500/40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Timer with Progress Ring */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-14 h-14" aria-label="Elapsed time">
              {(() => {
                const target = isTimed ? currentExercise.reps : currentExercise.reps;
                const progress = Math.min(1, (isTimed ? elapsedTime : exerciseStats.reps) / Math.max(1, target));
                const deg = Math.round(progress * 360);
                const bg = `conic-gradient(var(--color-primary-light) ${deg}deg, rgba(255,255,255,0.15) 0deg)`;
                return (
                  <>
                    <div className="absolute inset-0 rounded-full shadow-lg" style={{ background: bg }} />
                    <div className="absolute inset-1.5 bg-[var(--color-bg-dark)] rounded-full flex items-center justify-center border border-white/10">
                      <span className="font-mono text-xs font-bold">{formatTime(elapsedTime)}</span>
                    </div>
                  </>
                )
              })()}
            </div>
              <div className="text-left">
                <div className="chip chip-primary text-xs py-1 px-2.5">
                  <span className="font-bold">{currentExerciseIndex + 1}</span>
                  <span className="text-white/60 mx-0.5">/</span>
                  <span>{currentWorkout.exercises.length}</span>
                </div>
                <p className="text-[10px] text-white/50 mt-1">Exercise</p>
              </div>
              {voiceCmdOn && (
                <span className={`chip ${listeningActive ? 'chip-primary' : ''} text-[10px]`}>Cmds {listeningActive ? 'ON' : '...'}</span>
              )}
            </div>
          </div>
        </div>

      {/* Exercise Name and Target - More prominent */}
      <div className="px-4 py-3 bg-gradient-to-b from-transparent to-[var(--color-bg-dark)]/30">
        <h2 className="text-xl font-bold text-center mb-1 heading-gradient">
          {currentExercise.name}
        </h2>
        <p className="text-center text-white/70 text-sm mb-3">
          Target: <span className="font-bold text-[var(--color-primary-light)] text-base">{currentExercise.reps}</span> {isTimed ? 'sec' : 'reps'}
        </p>
        
        {/* Settings Controls - Above Camera */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setVoiceOn(v => !v)}
            className={`chip text-xs py-1.5 px-3 transition-all duration-300 flex items-center gap-1.5 ${voiceOn ? 'chip-primary' : 'hover:bg-white/15'}`}
            title="Toggle voice feedback"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={voiceOn ? "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"} />
            </svg>
            <span>{voiceOn ? 'Voice ON' : 'Voice OFF'}</span>
          </button>
          <button
            onClick={handleToggleVoiceCmd}
            className={`chip text-xs py-1.5 px-3 transition-all duration-300 flex items-center gap-1.5 ${voiceCmdOn ? 'chip-primary' : 'hover:bg-white/15'}`}
            title="Toggle voice commands"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7v4a7 7 0 11-14 0V7m14 0a2 2 0 10-4 0m4 0h-4M5 7a2 2 0 114 0H5" />
            </svg>
            <span>{voiceCmdOn ? 'Cmds ON' : 'Cmds OFF'}</span>
          </button>
          {micError && (
            <span className="chip text-xs py-1.5 px-3 border-[var(--color-accent)]/50 text-[var(--color-accent)]">
              {micError}
            </span>
          )}
          
          {['lenient','normal','strict'].map((level) => (
            <button
              key={level}
              onClick={() => setSensitivity(level)}
              className={`chip text-xs py-1.5 px-3 transition-all duration-300 ${sensitivity === level ? 'chip-primary' : 'hover:bg-white/15'}`}
            >
              {level === 'lenient' ? 'Easy' : level === 'normal' ? 'Normal' : 'Strict'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area with Live Stats Overlay */}
      <div className="flex-1 relative overflow-hidden">
        {currentExercise.hasTracking ? (
          <>
            <PoseDetection
              exercise={currentExercise}
              onStatsUpdate={setExerciseStats}
              voiceEnabled={voiceOn}
              sensitivity={sensitivity}
              paused={isPaused || resumeCountdown > 0}
            />
            
            {/* PROMINENT LIVE STATS OVERLAY - Bottom so it doesn't block camera */}
            <div className="absolute bottom-4 left-0 right-0 px-4 z-10 pointer-events-none">
              <div className="flex items-end justify-between gap-3">
                {/* Good Form - Bottom Left */}
                <div className="glass rounded-2xl p-3 backdrop-blur-xl border-2 border-[var(--color-success)]/30 shadow-2xl animate-scale-in">
                  <p className="text-4xl font-black text-[var(--color-success)] mb-1 drop-shadow-lg">
                    {exerciseStats.goodForm}
                  </p>
                  <p className="text-xs text-white/80 font-bold uppercase tracking-wide">Good Form</p>
                </div>
                
                {/* Bad Form - Bottom Right */}
                <div className="glass rounded-2xl p-3 backdrop-blur-xl border-2 border-[var(--color-accent)]/30 shadow-2xl animate-scale-in">
                  <p className="text-4xl font-black text-[var(--color-accent)] mb-1 drop-shadow-lg">
                    {exerciseStats.badForm}
                  </p>
                  <p className="text-xs text-white/80 font-bold uppercase tracking-wide">Bad Form</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="mb-8 text-center">
              <p className="text-8xl font-black mb-3 bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
                {exerciseStats.reps}
              </p>
              <p className="text-white/70 text-base font-bold uppercase tracking-wider">Manual count</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() =>
                  setExerciseStats((prev) => ({
                    ...prev,
                    reps: Math.max(0, prev.reps - 1),
                  }))
                }
                className="w-16 h-16 rounded-2xl bg-white/10 hover:bg-white/20 text-3xl font-bold border-2 border-white/20 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
              >
                −
              </button>
              <button
                onClick={() =>
                  setExerciseStats((prev) => ({
                    ...prev,
                    reps: prev.reps + 1,
                    goodForm: prev.goodForm + 1,
                  }))
                }
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] text-3xl font-bold shadow-2xl hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all duration-300 hover:scale-110 active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTONS - Sides of screen, don't block camera */}
      <div className="fixed top-1/2 left-0 right-0 z-20 pointer-events-none transform -translate-y-1/2">
        <div className="flex items-center justify-between px-2">
          {/* Pause Button - Left Side */}
          <button
            onClick={handlePauseToggle}
            className={`pointer-events-auto w-16 h-16 rounded-full font-bold transition-all duration-300 shadow-2xl border-2 flex items-center justify-center ${
              isPaused 
                ? 'bg-gradient-to-br from-[var(--color-success)] to-green-500 border-green-400 hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:scale-110' 
                : 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-400 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] animate-pulse hover:scale-110'
            }`}
            title={isPaused ? 'Resume Workout' : 'Pause Workout'}
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d={isPaused ? "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" : "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"} clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Next/Finish Button - Right Side */}
          <button
            onClick={handleExerciseComplete}
            className="pointer-events-auto w-16 h-16 rounded-full font-bold btn btn-primary group shadow-2xl hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] border-2 border-purple-400 hover:scale-110 transition-all duration-300 flex items-center justify-center"
            title={isLastExercise ? "Finish Workout" : "Next Exercise"}
          >
            <svg className="w-8 h-8 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={isLastExercise ? "M5 13l4 4L19 7" : "M14 5l7 7m0 0l-7 7m7-7H3"} />
            </svg>
          </button>
        </div>
      </div>

      {(isPaused || resumeCountdown > 0) && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center p-8 rounded-2xl bg-[var(--color-bg-card)]/50 backdrop-blur-lg border border-white/20 shadow-2xl animate-scale-in">
            {resumeCountdown > 0 ? (
              <div>
                <p className="text-white/80 mb-4 text-lg font-medium">Resuming in</p>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] animate-pulse" style={{ opacity: 0.2 }}></div>
                  <div className="absolute inset-2 rounded-full bg-[var(--color-bg-dark)] flex items-center justify-center">
                    <p className="text-7xl font-bold bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] bg-clip-text text-transparent animate-pulse">
                      {resumeCountdown}
                    </p>
                  </div>
                </div>
                <p className="text-white/60 text-sm">Get ready!</p>
              </div>
            ) : (
              <div>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-warning)]/20 flex items-center justify-center border-4 border-[var(--color-warning)]/40">
                  <svg className="w-10 h-10 text-[var(--color-warning)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-4xl font-bold mb-6 heading-gradient">Workout Paused</p>
                <button
                  onClick={handlePauseToggle}
                  className="px-8 py-4 rounded-xl font-bold text-lg btn btn-primary"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Resume
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
