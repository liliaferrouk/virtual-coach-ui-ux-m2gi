import { useEffect, useRef, useState } from "react";

export default function PoseDetection({ exercise, onStatsUpdate, voiceEnabled = true, sensitivity = 'normal', paused = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [needsUserStart, setNeedsUserStart] = useState(false);
  const [displayStats, setDisplayStats] = useState({ reps: 0, goodForm: 0, badForm: 0 });

  // Refs for pose detection state
  const poseRef = useRef(null);
  const rafRef = useRef(0);
  const sensitivityRef = useRef(sensitivity);
  const voiceEnabledRef = useRef(voiceEnabled);
  const pausedRef = useRef(paused);
  const exerciseRef = useRef(exercise);
  const onStatsUpdateRef = useRef(onStatsUpdate);
  const statsRef = useRef({ reps: 0, goodForm: 0, badForm: 0 });
  const stateRef = useRef({
    isDescending: false,
    isAscending: false,
    lastRepTime: 0,
    holdFrames: 0,
    smoothedAngle: 180,
    started: false,
    lastPlankTick: 0,
    minElbowAngle: 180,
    minKneeAngle: 180,
    kneePeakHeight: 1,
    lastMotivationLeft: null,
    lastSpokenAt: 0,
    lastSpokenMsg: "",
    prevKneeAngle: null,
    prevElbowAngle: null,
    lastMotionAt: Date.now(),
    repMotion: 0,
    repStartAngle: null,
    warmupFrames: 0,
  });

  // Keep refs in sync without tearing down camera
  useEffect(() => { sensitivityRef.current = sensitivity }, [sensitivity]);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled }, [voiceEnabled]);
  useEffect(() => { pausedRef.current = paused }, [paused]);
  useEffect(() => { exerciseRef.current = exercise }, [exercise]);
  useEffect(() => { onStatsUpdateRef.current = onStatsUpdate }, [onStatsUpdate]);

  // Reset counters and per-exercise state when the exercise changes
  useEffect(() => {
    // Reset stats counters for the new exercise
    statsRef.current = { reps: 0, goodForm: 0, badForm: 0 };
    setDisplayStats({ reps: 0, goodForm: 0, badForm: 0 });

    // Soft reset detection state while preserving camera session
    stateRef.current.isDescending = false;
    stateRef.current.isAscending = false;
    stateRef.current.lastRepTime = 0;
    stateRef.current.holdFrames = 0;
    stateRef.current.smoothedAngle = 180;
    stateRef.current.minElbowAngle = 180;
    stateRef.current.minKneeAngle = 180;
    stateRef.current.kneePeakHeight = 1;
    stateRef.current.prevKneeAngle = null;
    stateRef.current.prevElbowAngle = null;
    stateRef.current.repMotion = 0;
    stateRef.current.repStartAngle = null;
    stateRef.current.warmupFrames = 0;
    stateRef.current.lastMotionAt = Date.now();
    stateRef.current.lastMotivationLeft = null;
    // Reset speech cooldown for new exercise
    stateRef.current.lastSpokenAt = 0;
    stateRef.current.lastSpokenMsg = "";
  }, [exercise]);

  useEffect(() => {
    let mounted = true;

    const initPoseDetection = async () => {
      try {
        if (stateRef.current.started) return; // prevent double init in StrictMode
        // Load MediaPipe scripts dynamically
        const loadScript = (src) => {
          return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.crossOrigin = "anonymous";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        };

        // Check if scripts are already loaded
        if (!window.Pose) {
          await loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js"
          );
          await loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
          );
          await loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
          );
        }

        if (!mounted) return;

        // Initialize pose detection
        poseRef.current = new window.Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          },
        });

        poseRef.current.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        poseRef.current.onResults((results) => {
          if (!mounted) return;
          processResults(results);
        });

        // Get camera access with fallbacks
        const acquireStream = async () => {
          const constraintsList = [
            { video: { facingMode: { ideal: "user" }, width: { ideal: 640 }, height: { ideal: 480 } } },
            { video: { facingMode: "user" } },
            { video: true },
            { video: { facingMode: "environment" } },
          ];

          // Try simple fallbacks first
          for (const cons of constraintsList) {
            try {
              return await navigator.mediaDevices.getUserMedia(cons);
            } catch (e) {
              // continue trying
            }
          }

          // Try specific deviceId if available
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cams = devices.filter((d) => d.kind === "videoinput");
            for (const cam of cams) {
              try {
                return await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: cam.deviceId } } });
              } catch (_) {
                /* keep trying next */
              }
            }
          } catch (_) {
            // ignore enumerateDevices failures
          }

          throw new Error("Unable to acquire camera stream");
        };

        const stream = await acquireStream();

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (e) {
            // Some browsers (Firefox) require a user gesture to start playback
            setNeedsUserStart(true);
          }

          const frameLoop = async () => {
            if (!mounted) return;
            try {
              if (!pausedRef.current && poseRef.current && videoRef.current && videoRef.current.readyState >= 2) {
                await poseRef.current.send({ image: videoRef.current });
              }
            } catch (_) {
              // ignore frame errors
            }
            rafRef.current = requestAnimationFrame(frameLoop);
          };

          rafRef.current = requestAnimationFrame(frameLoop);
          stateRef.current.started = true;
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Pose detection error:", err);
        if (mounted) {
          let msg = err && err.name ? err.name + ": " : "";
          const hint = (name) => {
            switch (name) {
              case "NotReadableError":
                return "Camera is in use by another app or tab. Close other apps or tabs using the camera, then retry.";
              case "NotAllowedError":
              case "SecurityError":
                return "Camera permission blocked. Allow access in browser site settings and OS privacy settings.";
              case "NotFoundError":
                return "No camera device found. Connect a camera or check drivers.";
              case "OverconstrainedError":
                return "Camera doesn’t support requested settings. Retrying with simpler settings failed.";
              default:
                return "Failed to initialize camera. Ensure you’re on HTTPS or localhost and permissions are granted.";
            }
          };
          msg += hint(err?.name);
          setError(msg);
          setIsLoading(false);
        }
      }
    };

    const speak = (text, opts = {}) => {
      try {
        if (!voiceEnabledRef.current) return;
        const synth = window.speechSynthesis;
        if (!synth || !text) return;
        const now = Date.now();
        const cooldown = opts.cooldownMs ?? 2000;
        const plankCooldown = 6000;
        const isPlankHint = /hold steady|align hips/i.test(text);
        const effectiveCooldown = isPlankHint ? plankCooldown : cooldown;
        if (text === stateRef.current.lastSpokenMsg && now - stateRef.current.lastSpokenAt < effectiveCooldown) return;
        if (now - stateRef.current.lastSpokenAt < effectiveCooldown) return;
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1;
        u.pitch = 1;
        u.volume = 1;
        synth.speak(u);
        stateRef.current.lastSpokenAt = now;
        stateRef.current.lastSpokenMsg = text;
      } catch (_) { /* ignore TTS errors */ }
    };

    const vibrate = (ms = 15) => {
      try {
        if (navigator.vibrate) navigator.vibrate(ms);
      } catch (_) { /* ignore */ }
    };

    const setFeedbackAndSpeak = (text, opts) => {
      setFeedback(text);
      speak(text, opts);
    };

    const maybeMotivate = () => {
      if (!exercise || !exercise.reps) return;
      const isTimed = exercise.unit === 'seconds' || exercise.id === 'plank';
      const left = Math.max(0, (exercise.reps || 0) - (statsRef.current.reps || 0));
      if (left > 0 && ((isTimed && left <= 5) || (!isTimed && left <= 3))) {
        if (stateRef.current.lastMotivationLeft !== left) {
          const msg = isTimed ? `${left} seconds left, keep going!` : `Keep going! ${left} left`;
          speak(msg, { cooldownMs: 1000 });
          stateRef.current.lastMotivationLeft = left;
        }
      }
    };

    const thr = (base, type = 'angle') => {
      const s = sensitivityRef.current;
      if (s === 'lenient') return type === 'angle' ? base + 5 : base * 0.9;
      if (s === 'strict') return type === 'angle' ? base - 5 : base * 1.1;
      return base;
    };

    const processResults = (results) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !results.image) return;

      // Clear and draw video frame
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Mirror the video
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      if (results.poseLandmarks) {
        // Filter by visibility
        const visThresh = 0.5;
        const lms = results.poseLandmarks.map((p) => ({ ...p }));
        const hasCore = [11,12,13,14,15,16,23,24,25,26,27,28].every((i)=> lms[i] && lms[i].visibility >= 0.2);
        if (!hasCore) {
          setFeedbackAndSpeak("Move into frame", { cooldownMs: 4000 });
        }
        // Draw skeleton
        drawSkeleton(ctx, lms, canvas.width);

        // Warmup frames to reduce false positives at start
        if (stateRef.current.warmupFrames < 10) {
          stateRef.current.warmupFrames++;
        }

        // Analyze pose based on exercise type
        const ex = exerciseRef.current || {};
        if (ex.id === "squats") {
          analyzeSquat(lms, ctx, canvas);
        } else if (ex.id === "pushups") {
          analyzePushup(lms, ctx, canvas);
        } else if (ex.id === "lunges") {
          analyzeLunge(lms, ctx, canvas);
        } else if (ex.id === "jumping-jacks") {
          analyzeJumpingJack(lms, ctx, canvas);
        } else if (ex.id === "crunches") {
          analyzeCrunch(lms, ctx, canvas);
        } else if (ex.id === "tricep-dips") {
          analyzeTricepDip(lms, ctx, canvas);
        } else if (ex.id === "high-knees") {
          analyzeHighKnees(lms, ctx, canvas);
        } else if (ex.id === "plank") {
          analyzePlank(lms, ctx, canvas);
        } else {
          // Generic rep counter for other exercises
          analyzeGeneric(results.poseLandmarks, ctx, canvas);
        }

        // Idle detection for gentle nudges
        const nowTs = Date.now();
        if (nowTs - stateRef.current.lastMotionAt > 3500) {
          setFeedbackAndSpeak("Keep moving", { cooldownMs: 6000 });
          stateRef.current.lastMotionAt = nowTs; // avoid repeated nudges
        }
      }
    };

    const drawSkeleton = (ctx, landmarks, canvasWidth) => {
      // Draw connections
      const connections = [
        [11, 12],
        [11, 13],
        [13, 15],
        [12, 14],
        [14, 16],
        [11, 23],
        [12, 24],
        [23, 24],
        [23, 25],
        [25, 27],
        [24, 26],
        [26, 28],
      ];

      ctx.strokeStyle = "#05667B";
      ctx.lineWidth = 8;

      connections.forEach(([i, j]) => {
        const a = landmarks[i];
        const b = landmarks[j];
        if (a && b && a.visibility > 0.5 && b.visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(canvasWidth - a.x * canvasWidth, a.y * ctx.canvas.height);
          ctx.lineTo(canvasWidth - b.x * canvasWidth, b.y * ctx.canvas.height);
          ctx.stroke();
        }
      });

      // Draw key points
      const keyPoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
      keyPoints.forEach((i) => {
        const point = landmarks[i];
        if (point && point.visibility > 0.5) {
          ctx.fillStyle = "#FF6B6B";
          ctx.beginPath();
          ctx.arc(
            canvasWidth - point.x * canvasWidth,
            point.y * ctx.canvas.height,
            4,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      });
    };

    const calculateAngle = (a, b, c) => {
      const radians =
        Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
      let angle = Math.abs((radians * 180) / Math.PI);
      if (angle > 180) angle = 360 - angle;
      return angle;
    };

    const torsoLeanTooMuch = (shoulder, hip, threshold = 0.18) => {
      if (!shoulder || !hip) return false;
      return Math.abs(shoulder.x - hip.x) > threshold;
    };

    const kneeOverAnkle = (knee, ankle, tolerance = 0.12) => {
      if (!knee || !ankle) return true;
      return Math.abs(knee.x - ankle.x) <= tolerance;
    };

    const hipSag = (shoulder, hip, ankle) => {
      if (!shoulder || !hip || !ankle) return false;
      const bodyAngle = calculateAngle(shoulder, hip, ankle);
      return bodyAngle < 155;
    };

    const analyzeSquat = (landmarks, ctx, canvas) => {
      const hip = landmarks[24];
      const knee = landmarks[26];
      const ankle = landmarks[28];

      if (!hip || !knee || !ankle) return;

      const kneeAngle = calculateAngle(hip, knee, ankle);

      // Smooth the angle
      const alpha = 0.3;
      stateRef.current.smoothedAngle =
        alpha * kneeAngle + (1 - alpha) * stateRef.current.smoothedAngle;

      const angle = stateRef.current.smoothedAngle;
      const now = Date.now();

      // Track bottom depth while descending and motion detection
      if (stateRef.current.isDescending) {
        stateRef.current.minKneeAngle = Math.min(stateRef.current.minKneeAngle, angle);
      }
      const prev = stateRef.current.prevKneeAngle ?? angle;
      const vel = angle - prev;
      if (Math.abs(vel) > 0.7) stateRef.current.lastMotionAt = now;
      stateRef.current.prevKneeAngle = angle;

      // Check for rep
      const s1 = sensitivityRef.current;
      if (angle < (105 + (s1 === 'lenient' ? 10 : s1 === 'strict' ? 0 : 5)) && !stateRef.current.isDescending) {
        stateRef.current.holdFrames++;
        if (stateRef.current.holdFrames >= 3) {
          // guard: avoid starting a rep immediately after init
          if (stateRef.current.warmupFrames >= 10) {
            stateRef.current.isDescending = true;
            stateRef.current.minKneeAngle = angle;
            stateRef.current.repMotion = 0;
            stateRef.current.repStartAngle = angle;
          }
          stateRef.current.holdFrames = 0;
        }
      } else if (angle > (155 + (sensitivityRef.current === 'strict' ? 5 : 0)) && stateRef.current.isDescending) {
        if (now - stateRef.current.lastRepTime > 800) {
          // Check form using tracked bottom
          const torso = landmarks[12];
          const s = sensitivityRef.current;
          const depthOK = stateRef.current.minKneeAngle < (s === 'strict' ? 100 : s === 'lenient' ? 112 : 105);
          const hipsBelowKnee = hip.y > knee.y - 0.02;
          const backUpright = torso && !torsoLeanTooMuch(torso, hip, 0.2);
          const kneeTrack = kneeOverAnkle(knee, ankle, 0.12);
          const amplitudeOK = (stateRef.current.repStartAngle ?? 180) - stateRef.current.minKneeAngle > 15;
          const motionOK = stateRef.current.repMotion > 8;
          const faults = [];
          if (!depthOK || !amplitudeOK) faults.push("Go deeper");
          if (!hipsBelowKnee) faults.push("Lower hips");
          if (!backUpright) faults.push("Keep chest up");
          if (!kneeTrack) faults.push("Knee over ankle");
          const isGoodForm = faults.length === 0 && motionOK;

          statsRef.current.reps++;
          if (isGoodForm) {
            statsRef.current.goodForm++;
            setFeedbackAndSpeak("Good squat");
            vibrate(15);
          } else {
            statsRef.current.badForm++;
            setFeedbackAndSpeak(faults.join(" • "));
          }

          setDisplayStats({ ...statsRef.current });
          onStatsUpdateRef.current({ ...statsRef.current });
          maybeMotivate();
          stateRef.current.lastRepTime = now;
        }
        stateRef.current.isDescending = false;
        stateRef.current.minKneeAngle = 180;
        stateRef.current.repMotion = 0;
        stateRef.current.repStartAngle = null;
      }

      // Draw feedback
      ctx.fillStyle = stateRef.current.isDescending ? "#10B981" : "#FF6B6B";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`Angle: ${Math.round(angle)}°`, 10, 30);
    };

    const analyzePushup = (landmarks, ctx, canvas) => {
      const shoulder = landmarks[12];
      const elbow = landmarks[14];
      const wrist = landmarks[16];
      const hip = landmarks[24];
      const ankle = landmarks[28];

      if (!shoulder || !elbow || !wrist) return;

      const elbowAngle = calculateAngle(shoulder, elbow, wrist);
      const bodyAngle = calculateAngle(shoulder, hip, ankle);
      const now = Date.now();

      if (stateRef.current.isDescending) {
        stateRef.current.minElbowAngle = Math.min(stateRef.current.minElbowAngle, elbowAngle);
      }
      const prevE = stateRef.current.prevElbowAngle ?? elbowAngle;
      const velE = elbowAngle - prevE;
      if (Math.abs(velE) > 0.7) stateRef.current.lastMotionAt = now;
      stateRef.current.prevElbowAngle = elbowAngle;
      if (stateRef.current.isDescending) stateRef.current.repMotion += Math.abs(velE);

      if (elbowAngle < (sensitivityRef.current === 'strict' ? 90 : 95) && !stateRef.current.isDescending) {
        stateRef.current.isDescending = true;
        stateRef.current.minElbowAngle = elbowAngle;
        stateRef.current.repMotion = 0;
        stateRef.current.repStartAngle = elbowAngle;
      } else if (elbowAngle > (sensitivityRef.current === 'strict' ? 165 : 160) && stateRef.current.isDescending) {
        if (now - stateRef.current.lastRepTime > 800) {
          statsRef.current.reps++;
          const depthOK = stateRef.current.minElbowAngle <= (sensitivityRef.current === 'strict' ? 90 : 95);
          const straightBody = bodyAngle > (sensitivityRef.current === 'strict' ? 165 : 160) && !hipSag(shoulder, hip, ankle);
          const amplitudeOK = (stateRef.current.repStartAngle ?? 180) - stateRef.current.minElbowAngle > 10;
          const motionOK = stateRef.current.repMotion > 6;
          const faults = [];
          if (!depthOK) faults.push("Go deeper");
          if (!straightBody) faults.push("Keep body straight");
          if (faults.length === 0 && motionOK && amplitudeOK) {
            statsRef.current.goodForm++;
            setFeedbackAndSpeak("Good rep");
            vibrate(15);
          } else {
            statsRef.current.badForm++;
            setFeedbackAndSpeak(faults.join(" • "));
          }
          setDisplayStats({ ...statsRef.current });
          onStatsUpdateRef.current({ ...statsRef.current });
          maybeMotivate();
          stateRef.current.lastRepTime = now;
        }
        stateRef.current.isDescending = false;
        stateRef.current.minElbowAngle = 180;
        stateRef.current.repMotion = 0;
        stateRef.current.repStartAngle = null;
      }
    };

    const analyzeLunge = (landmarks, ctx, canvas) => {
      const hip = landmarks[24];
      const knee = landmarks[26];
      const ankle = landmarks[28];

      if (!hip || !knee || !ankle) return;

      const kneeAngle = calculateAngle(hip, knee, ankle);
      const now = Date.now();

      if (stateRef.current.isDescending) {
        stateRef.current.minKneeAngle = Math.min(stateRef.current.minKneeAngle, kneeAngle);
      }
      const prevLK = stateRef.current.prevKneeAngle ?? kneeAngle;
      const velLK = kneeAngle - prevLK;
      if (Math.abs(velLK) > 0.7) stateRef.current.lastMotionAt = now;
      stateRef.current.prevKneeAngle = kneeAngle;
      if (stateRef.current.isDescending) stateRef.current.repMotion += Math.abs(velLK);

      if (kneeAngle < (sensitivityRef.current === 'strict' ? 100 : 105) && !stateRef.current.isDescending) {
        stateRef.current.isDescending = true;
        stateRef.current.minKneeAngle = kneeAngle;
        stateRef.current.repMotion = 0;
        stateRef.current.repStartAngle = kneeAngle;
      } else if (kneeAngle > (sensitivityRef.current === 'strict' ? 165 : 160) && stateRef.current.isDescending) {
        if (now - stateRef.current.lastRepTime > 1000) {
          statsRef.current.reps++;
          const depthOK = stateRef.current.minKneeAngle < (sensitivityRef.current === 'strict' ? 95 : 100);
          const shinVertical = kneeOverAnkle(knee, ankle, 0.12);
          const torso = landmarks[12];
          const upright = torso && !torsoLeanTooMuch(torso, hip, 0.22);
          const amplitudeOK = (stateRef.current.repStartAngle ?? 180) - stateRef.current.minKneeAngle > 12;
          const motionOK = stateRef.current.repMotion > 7;
          const faults = [];
          if (!depthOK) faults.push("Go deeper");
          if (!shinVertical) faults.push("Knee over ankle");
          if (!upright) faults.push("Keep torso upright");
          if (faults.length === 0 && motionOK && amplitudeOK) { statsRef.current.goodForm++; setFeedbackAndSpeak("Good lunge"); vibrate(15); }
          else { statsRef.current.badForm++; setFeedbackAndSpeak(faults.join(" • ")); }
          setDisplayStats({ ...statsRef.current });
          onStatsUpdateRef.current({ ...statsRef.current });
          maybeMotivate();
          stateRef.current.lastRepTime = now;
        }
        stateRef.current.isDescending = false;
        stateRef.current.minKneeAngle = 180;
        stateRef.current.repMotion = 0;
        stateRef.current.repStartAngle = null;
      }
    };

    const analyzeJumpingJack = (landmarks, ctx, canvas) => {
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];

      if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return;

      const armsUp =
        leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
      const now = Date.now();

      if (armsUp && !stateRef.current.isAscending) {
        stateRef.current.isAscending = true;
        stateRef.current.lastMotionAt = now;
      } else if (!armsUp && stateRef.current.isAscending) {
        if (now - stateRef.current.lastRepTime > 400) {
          statsRef.current.reps++;
          // Require arms clearly above shoulders; tighten by sensitivity
          const armLift = sensitivityRef.current === 'strict' ? 0.12 : sensitivityRef.current === 'lenient' ? 0.08 : 0.10;
          const highEnough =
            leftWrist.y < leftShoulder.y - armLift && rightWrist.y < rightShoulder.y - armLift;
          if (highEnough) { statsRef.current.goodForm++; setFeedbackAndSpeak("Jump!"); vibrate(10); }
          else { statsRef.current.badForm++; setFeedbackAndSpeak("Arms higher"); }
          setDisplayStats({ ...statsRef.current });
          onStatsUpdateRef.current({ ...statsRef.current });
          maybeMotivate();
          stateRef.current.lastRepTime = now;
        }
        stateRef.current.isAscending = false;
      }
    };

    const analyzeHighKnees = (landmarks, ctx, canvas) => {
      const leftKnee = landmarks[25];
      const rightKnee = landmarks[26];
      const hipL = landmarks[23];
      const hipR = landmarks[24];
      if (!leftKnee || !rightKnee || !hipL || !hipR) return;
      const hipY = Math.min(hipL.y, hipR.y);
      const kneeUp = (leftKnee.y < hipY - 0.02) || (rightKnee.y < hipY - 0.02);
      const now = Date.now();
      if (kneeUp && !stateRef.current.isAscending) {
        stateRef.current.isAscending = true;
        stateRef.current.kneePeakHeight = Math.min(leftKnee.y, rightKnee.y);
        stateRef.current.lastMotionAt = now;
      } else if (!kneeUp && stateRef.current.isAscending) {
        if (now - stateRef.current.lastRepTime > 350) {
          statsRef.current.reps++;
          const kneeLift = sensitivityRef.current === 'strict' ? 0.10 : sensitivityRef.current === 'lenient' ? 0.06 : 0.08;
          const high = stateRef.current.kneePeakHeight < hipY - kneeLift;
          if (high) { statsRef.current.goodForm++; setFeedbackAndSpeak("Knees up!"); vibrate(10); }
          else { statsRef.current.badForm++; setFeedbackAndSpeak("Higher knees"); }
          setDisplayStats({ ...statsRef.current });
          onStatsUpdateRef.current({ ...statsRef.current });
          maybeMotivate();
          stateRef.current.lastRepTime = now;
        }
        stateRef.current.isAscending = false;
        stateRef.current.kneePeakHeight = 1;
      }
    }

    const analyzeCrunch = (landmarks, ctx, canvas) => {
      const shoulder = landmarks[12];
      const hip = landmarks[24];
      const knee = landmarks[26];
      if (!shoulder || !hip || !knee) return;
      // Shoulder moves towards knee on crunch
      const distY = shoulder.y - hip.y; // negative when shoulder above hip
      const now = Date.now();
      if (distY < -0.08 && !stateRef.current.isAscending) {
        stateRef.current.isAscending = true;
        stateRef.current.lastMotionAt = now;
      } else if (distY > -0.02 && stateRef.current.isAscending) {
        if (now - stateRef.current.lastRepTime > 700) {
          statsRef.current.reps++;
          // Basic form: keep knee bent (knee angle < 150)
          const kneeAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
          const curlRange = sensitivityRef.current === 'strict' ? -0.12 : sensitivityRef.current === 'lenient' ? -0.08 : -0.10;
          const rangeOK = distY < curlRange; // enough torso curl
          const kneesBent = kneeAngle < (sensitivityRef.current === 'strict' ? 145 : sensitivityRef.current === 'lenient' ? 155 : 150);
          const faults = [];
          if (!rangeOK) faults.push("Curl more");
          if (!kneesBent) faults.push("Bend knees");
          if (faults.length === 0) { statsRef.current.goodForm++; setFeedbackAndSpeak("Nice crunch"); vibrate(10); }
          else { statsRef.current.badForm++; setFeedbackAndSpeak(faults.join(" • ")); }
          setDisplayStats({ ...statsRef.current });
          onStatsUpdateRef.current({ ...statsRef.current });
          maybeMotivate();
          stateRef.current.lastRepTime = now;
        }
        stateRef.current.isAscending = false;
      }
    }

    const analyzeTricepDip = (landmarks, ctx, canvas) => {
      const shoulder = landmarks[12];
      const elbow = landmarks[14];
      const wrist = landmarks[16];
      if (!shoulder || !elbow || !wrist) return;
      const elbowAngle = calculateAngle(shoulder, elbow, wrist);
      const now = Date.now();
      // Track motion for quality gate
      if (stateRef.current.isDescending) {
        stateRef.current.minElbowAngle = Math.min(stateRef.current.minElbowAngle, elbowAngle);
      }
      const prev = stateRef.current.prevElbowAngle ?? elbowAngle;
      const vel = elbowAngle - prev;
      if (Math.abs(vel) > 0.7) stateRef.current.lastMotionAt = now;
      stateRef.current.prevElbowAngle = elbowAngle;
      if (stateRef.current.isDescending) stateRef.current.repMotion += Math.abs(vel);

      // Start at bottom (descending)
      const bottomAngle = thr(95, 'angle');
      if (elbowAngle < bottomAngle && !stateRef.current.isDescending) {
        if (stateRef.current.warmupFrames >= 5) {
          stateRef.current.isDescending = true;
          stateRef.current.minElbowAngle = elbowAngle;
          stateRef.current.repMotion = 0;
          stateRef.current.repStartAngle = elbowAngle;
        }
      } else if (elbowAngle > thr(160, 'angle') && stateRef.current.isDescending) {
        if (now - stateRef.current.lastRepTime > 700) {
          statsRef.current.reps++;
          const depthOK = stateRef.current.minElbowAngle <= bottomAngle;
          const amplitudeOK = (stateRef.current.repStartAngle ?? 180) - stateRef.current.minElbowAngle > 10;
          const motionOK = stateRef.current.repMotion > 6;
          const faults = [];
          if (!depthOK || !amplitudeOK) faults.push("Go deeper");
          if (!motionOK) faults.push("Faster down-up");
          if (faults.length === 0) { statsRef.current.goodForm++; setFeedbackAndSpeak("Good dip"); vibrate(10); }
          else { statsRef.current.badForm++; setFeedbackAndSpeak(faults.join(" • ")); }
          setDisplayStats({ ...statsRef.current });
          onStatsUpdateRef.current({ ...statsRef.current });
          maybeMotivate();
          stateRef.current.lastRepTime = now;
        }
        stateRef.current.isDescending = false;
        stateRef.current.minElbowAngle = 180;
        stateRef.current.repMotion = 0;
        stateRef.current.repStartAngle = null;
      }
    }

    const analyzePlank = (landmarks, ctx, canvas) => {
      // Time under tension counter when in good plank form
      const shoulder = landmarks[12];
      const hip = landmarks[24];
      const ankle = landmarks[28];
      if (!shoulder || !hip || !ankle) return;
      const bodyAngle = calculateAngle(shoulder, hip, ankle);
      const hipsLevel = Math.abs(hip.y - ((shoulder.y + ankle.y) / 2)) < 0.12;
      const straight = bodyAngle > 155; // near straight
      const goodForm = hipsLevel && straight;
      const now = Date.now();
      if (goodForm) {
        // Tick every 1000ms
        if (now - stateRef.current.lastPlankTick >= 1000) {
          statsRef.current.reps += 1; // seconds as reps
          statsRef.current.goodForm += 1;
          stateRef.current.lastPlankTick = now;
          setDisplayStats({ ...statsRef.current });
          onStatsUpdateRef.current({ ...statsRef.current });
          setFeedbackAndSpeak("Hold steady");
        }
      } else {
        if (now - stateRef.current.lastPlankTick >= 1000) {
          // count time but mark bad form to influence percentage
          statsRef.current.reps += 1;
          statsRef.current.badForm += 1;
          stateRef.current.lastPlankTick = now;
          setDisplayStats({ ...statsRef.current });
          onStatsUpdateRef.current({ ...statsRef.current });
          setFeedbackAndSpeak("Align hips & back");
        }
      }
    }

    const analyzeGeneric = (landmarks, ctx, canvas) => {
      // Simple motion detection for other exercises
      ctx.fillStyle = "#05667B";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("AI tracking active", 10, 30);
    };

    initPoseDetection();

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleUserStart = async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.play();
        setNeedsUserStart(false);
      }
    } catch (_) {
      // keep prompting
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="w-16 h-16 bg-[var(--color-accent)]/20 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-[var(--color-accent)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-[var(--color-accent)] font-medium mb-2">
          Camera Error
        </p>
        <p className="text-sm text-white/60">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-black">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas
        ref={canvasRef}
        width={600}
        height={640}
        className="w-full h-[60vh] sm:h-[65vh] object-contain"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-white/60">Initializing camera...</p>
          </div>
        </div>
      )}

      {/* Minimal overlay; stats displayed by parent */}

      {feedback && !isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 rounded-lg">
          <p className="text-sm font-medium">{feedback}</p>
        </div>
      )}

      {paused && !isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <p className="text-2xl font-semibold">Paused</p>
        </div>
      )}

      {needsUserStart && !isLoading && !error && (
        <button onClick={handleUserStart} className="absolute inset-0 flex items-center justify-center bg-black/70">
          <span className="px-4 py-2 rounded-lg btn btn-primary">Tap to enable camera</span>
        </button>
      )}

      {/* Progress bar moved to parent UI for cleaner layout */}
    </div>
  );
}
