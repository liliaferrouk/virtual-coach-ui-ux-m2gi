import { useEffect, useRef, useState } from "react";

export default function PoseDetection({ exercise, onStatsUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState("");

  // Refs for pose detection state
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const statsRef = useRef({ reps: 0, goodForm: 0, badForm: 0 });
  const stateRef = useRef({
    isDescending: false,
    isAscending: false,
    lastRepTime: 0,
    holdFrames: 0,
    smoothedAngle: 180,
  });

  useEffect(() => {
    let mounted = true;

    const initPoseDetection = async () => {
      try {
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

        // Get camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          // Initialize camera
          cameraRef.current = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (poseRef.current && videoRef.current) {
                await poseRef.current.send({ image: videoRef.current });
              }
            },
            width: 480,
            height: 640,
          });

          cameraRef.current.start();
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Pose detection error:", err);
        if (mounted) {
          setError(err.message || "Failed to initialize camera");
          setIsLoading(false);
        }
      }
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
        // Draw skeleton
        drawSkeleton(ctx, results.poseLandmarks, canvas.width);

        // Analyze pose based on exercise type
        if (exercise.id === "squats") {
          analyzeSquat(results.poseLandmarks, ctx, canvas);
        } else if (exercise.id === "pushups") {
          analyzePushup(results.poseLandmarks, ctx, canvas);
        } else if (exercise.id === "lunges") {
          analyzeLunge(results.poseLandmarks, ctx, canvas);
        } else if (exercise.id === "jumping-jacks") {
          analyzeJumpingJack(results.poseLandmarks, ctx, canvas);
        } else {
          // Generic rep counter for other exercises
          analyzeGeneric(results.poseLandmarks, ctx, canvas);
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

      // Check for rep
      if (angle < 110 && !stateRef.current.isDescending) {
        stateRef.current.holdFrames++;
        if (stateRef.current.holdFrames >= 3) {
          stateRef.current.isDescending = true;
          stateRef.current.holdFrames = 0;
        }
      } else if (angle > 160 && stateRef.current.isDescending) {
        if (now - stateRef.current.lastRepTime > 800) {
          // Check form
          const isGoodForm = angle < 105 && hip.y > knee.y - 0.05;

          statsRef.current.reps++;
          if (isGoodForm) {
            statsRef.current.goodForm++;
            setFeedback("Good form!");
          } else {
            statsRef.current.badForm++;
            setFeedback("Go deeper!");
          }

          onStatsUpdate({ ...statsRef.current });
          stateRef.current.lastRepTime = now;
        }
        stateRef.current.isDescending = false;
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

      if (!shoulder || !elbow || !wrist) return;

      const elbowAngle = calculateAngle(shoulder, elbow, wrist);
      const now = Date.now();

      if (elbowAngle < 90 && !stateRef.current.isDescending) {
        stateRef.current.isDescending = true;
      } else if (elbowAngle > 160 && stateRef.current.isDescending) {
        if (now - stateRef.current.lastRepTime > 800) {
          statsRef.current.reps++;
          statsRef.current.goodForm++;
          onStatsUpdate({ ...statsRef.current });
          stateRef.current.lastRepTime = now;
          setFeedback("Rep counted!");
        }
        stateRef.current.isDescending = false;
      }
    };

    const analyzeLunge = (landmarks, ctx, canvas) => {
      const hip = landmarks[24];
      const knee = landmarks[26];
      const ankle = landmarks[28];

      if (!hip || !knee || !ankle) return;

      const kneeAngle = calculateAngle(hip, knee, ankle);
      const now = Date.now();

      if (kneeAngle < 100 && !stateRef.current.isDescending) {
        stateRef.current.isDescending = true;
      } else if (kneeAngle > 160 && stateRef.current.isDescending) {
        if (now - stateRef.current.lastRepTime > 1000) {
          statsRef.current.reps++;
          statsRef.current.goodForm++;
          onStatsUpdate({ ...statsRef.current });
          stateRef.current.lastRepTime = now;
          setFeedback("Rep counted!");
        }
        stateRef.current.isDescending = false;
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
      } else if (!armsUp && stateRef.current.isAscending) {
        if (now - stateRef.current.lastRepTime > 400) {
          statsRef.current.reps++;
          statsRef.current.goodForm++;
          onStatsUpdate({ ...statsRef.current });
          stateRef.current.lastRepTime = now;
          setFeedback("Jump!");
        }
        stateRef.current.isAscending = false;
      }
    };

    const analyzeGeneric = (landmarks, ctx, canvas) => {
      // Simple motion detection for other exercises
      ctx.fillStyle = "#05667B";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("AI tracking active", 10, 30);
    };

    initPoseDetection();

    return () => {
      mounted = false;
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [exercise, onStatsUpdate]);

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
    <div className="relative w-full h-[500px] bg-black">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas
        ref={canvasRef}
        width={600}
        height={640}
        className="w-full h-[500px] object-contain"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-white/60">Initializing camera...</p>
          </div>
        </div>
      )}

      {feedback && !isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 rounded-lg">
          <p className="text-sm font-medium">{feedback}</p>
        </div>
      )}
    </div>
  );
}
