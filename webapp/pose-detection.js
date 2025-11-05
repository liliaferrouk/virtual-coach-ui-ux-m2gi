// Configuration de la caméra et du canvas
const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");

// Variables pour le comptage des répétitions
let squatCount = 0;
let squatStage = null; // "up" (debout) ou "down" (squat)
const TARGET_REPS = 20;

// Variables pour le suivi des squats (good/bad)
let totalSquats = 0;
let goodSquats = 0;
let badSquats = 0;

let currentSquatForm = null; // Pour suivre la forme actuelle du squat

// Seuils et lissage pour une détection plus robuste
const VIS_THR = 0.6; // visibilité minimale requise des repères
const MIN_DOWN_ANGLE = 110; // en-dessous de cet angle => position basse (augmenté pour éviter knee raise)
const MAX_UP_ANGLE = 160; // au-dessus de cet angle => position debout
const MIN_HIP_BELOW_KNEE_DY = 0.05; // la hanche doit être significativement plus basse que le genou
const MAX_KNEE_ANGLE_DIFF = 50; // différence maximale entre angles gauche/droit (symétrie) - augmenté pour moins de sensibilité
const MIN_SHOULDER_HIP_DY = -0.15; // épaule doit être au-dessus de la hanche (y négatif = plus haut)
const SMOOTH_ALPHA = 0.3; // lissage exponentiel
let smoothedAngle = null;
let smoothedHipKneeDy = null;
let downHoldFrames = 0;
const MIN_DOWN_HOLD_FRAMES = 3; // nombre minimal de frames à garder la position basse
let lastRepTs = 0;
const MIN_REP_INTERVAL_MS = 800; // temps minimal entre deux répétitions

// Configuration MediaPipe Pose
const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  },
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

// Fonction pour calculer l'angle entre trois points
function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }

  return angle;
}

// Fonction pour vérifier si le squat est de bonne forme
function checkSquatForm(kneeAngle, hipBelowKneeDy) {
  // Bonne forme si angle profond ET hanche clairement sous le genou
  return kneeAngle < 105 && hipBelowKneeDy > MIN_HIP_BELOW_KNEE_DY;
}

let donutGoodInstance = null;
let donutBadInstance = null;

// Fonction pour initialiser les donuts une seule fois
function initializeDonutCharts() {
  const donutGood = document.getElementById("donut-good");
  const donutBad = document.getElementById("donut-bad");

  donutGoodInstance = new Donutty(donutGood);
  donutBadInstance = new Donutty(donutBad);
}
// Fonction pour mettre à jour les graphiques de progression
function updateProgressCard() {
  // Update squat count
  document.getElementById("squat-count").textContent = `${totalSquats} times`;

  // Calculate percentages
  const goodPercentage =
    totalSquats > 0 ? Math.round((goodSquats / totalSquats) * 100) : 0;
  const badPercentage =
    totalSquats > 0 ? Math.round((badSquats / totalSquats) * 100) : 0;

  // Update percentage text
  document.getElementById("good-percentage").textContent = `${goodPercentage}%`;
  document.getElementById("bad-percentage").textContent = `${badPercentage}%`;

  // Update donut charts
  const donutGood = document.getElementById("donut-good");
  const donutBad = document.getElementById("donut-bad");

  donutGood.setAttribute("data-value", goodPercentage);
  donutBad.setAttribute("data-value", badPercentage);

  // Mettre à jour les instances existantes si elles existent
  if (donutGoodInstance) {
    donutGoodInstance.set("value", goodPercentage);
  }
  if (donutBadInstance) {
    donutBadInstance.set("value", badPercentage);
  }
}

// Call this function when a squat is detected
function onSquatDetected(isGoodForm) {
  if (totalSquats >= TARGET_REPS) {
    return;
  }
  totalSquats++;
  if (isGoodForm) {
    goodSquats++;
  } else {
    badSquats++;
  }
  updateProgressCard();
  if (totalSquats >= TARGET_REPS) {
    console.log("Objectif atteint! Felicitations!");
  }
}

// Callback pour traiter les résultats de détection
pose.onResults((results) => {
  // Effacer le canvas
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Dessiner l'image de la caméra
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  // Si des points de pose sont détectés
  if (results.poseLandmarks) {
    // Dessiner les connexions du squelette
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: "#00FF00",
      lineWidth: 4,
    });

    // Dessiner les points
    drawLandmarks(canvasCtx, results.poseLandmarks, {
      color: "#FF0000",
      lineWidth: 2,
      radius: 6,
    });

    const landmarks = results.poseLandmarks;

    // Récupérer repères gauche (23,25,27) et droit (24,26,28)
    const lHip = landmarks[23];
    const lKnee = landmarks[25];
    const lAnkle = landmarks[27];
    const rHip = landmarks[24];
    const rKnee = landmarks[26];
    const rAnkle = landmarks[28];

    // Récupérer épaules pour vérifier posture verticale
    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];

    // Vérifier la visibilité des repères nécessaires
    const leftVisible =
      lHip &&
      lKnee &&
      lAnkle &&
      (lHip.visibility ?? 1) > VIS_THR &&
      (lKnee.visibility ?? 1) > VIS_THR &&
      (lAnkle.visibility ?? 1) > VIS_THR;
    const rightVisible =
      rHip &&
      rKnee &&
      rAnkle &&
      (rHip.visibility ?? 1) > VIS_THR &&
      (rKnee.visibility ?? 1) > VIS_THR &&
      (rAnkle.visibility ?? 1) > VIS_THR;

    const shouldersVisible =
      lShoulder &&
      rShoulder &&
      (lShoulder.visibility ?? 1) > VIS_THR &&
      (rShoulder.visibility ?? 1) > VIS_THR;

    // IMPORTANT: Exiger que les DEUX jambes soient visibles pour un squat valide
    if (leftVisible && rightVisible && shouldersVisible) {
      // Calculer angle genou pour chaque côté valide
      const leftAngle = calculateAngle(lHip, lKnee, lAnkle);
      const rightAngle = calculateAngle(rHip, rKnee, rAnkle);

      // Vérifier la symétrie (les deux genoux doivent se plier ensemble)
      const angleDiff = Math.abs(leftAngle - rightAngle);
      const isSymmetric = angleDiff < MAX_KNEE_ANGLE_DIFF;

      // Utiliser la moyenne des deux angles pour plus de stabilité
      const kneeAngle = (leftAngle + rightAngle) / 2;

      // Calculer position moyenne des hanches et genoux
      const avgHipY = (lHip.y + rHip.y) / 2;
      const avgKneeY = (lKnee.y + rKnee.y) / 2;
      const avgShoulderY = (lShoulder.y + rShoulder.y) / 2;

      // Hanche sous le genou? (coordonnées MediaPipe normalisées, y augmente vers le bas)
      const hipKneeDy = avgHipY - avgKneeY;

      // Torse vertical? (épaules au-dessus des hanches)
      const shoulderHipDy = avgShoulderY - avgHipY;
      const isTorsoUpright = shoulderHipDy < MIN_SHOULDER_HIP_DY;

      // Lissage exponentiel
      smoothedAngle =
        smoothedAngle == null
          ? kneeAngle
          : SMOOTH_ALPHA * kneeAngle + (1 - SMOOTH_ALPHA) * smoothedAngle;
      smoothedHipKneeDy =
        smoothedHipKneeDy == null
          ? hipKneeDy
          : SMOOTH_ALPHA * hipKneeDy + (1 - SMOOTH_ALPHA) * smoothedHipKneeDy;

      // Afficher l'angle sur le canvas
      canvasCtx.fillStyle = "#FFFFFF";
      canvasCtx.font = "28px Arial";
      canvasCtx.strokeStyle = "#000000";
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeText(
        `Angle genou: ${Math.round(smoothedAngle)}°`,
        10,
        40
      );
      canvasCtx.fillText(`Angle genou: ${Math.round(smoothedAngle)}°`, 10, 40);
      canvasCtx.strokeText(
        `Hanche-Genou dy: ${smoothedHipKneeDy.toFixed(3)}`,
        10,
        70
      );
      canvasCtx.fillText(
        `Hanche-Genou dy: ${smoothedHipKneeDy.toFixed(3)}`,
        10,
        70
      );

      // Afficher le compteur
      canvasCtx.fillStyle = "#FFFF00";
      canvasCtx.font = "bold 40px Arial";
      canvasCtx.strokeText(`Squats: ${totalSquats}/${TARGET_REPS}`, 10, 110);
      canvasCtx.fillText(`Squats: ${totalSquats}/${TARGET_REPS}`, 10, 110);

      let feedback = "";
      let feedbackColor = "#FFFFFF";

      const now = performance.now();
      const isUp = smoothedAngle > MAX_UP_ANGLE;
      const isDown =
        smoothedAngle < MIN_DOWN_ANGLE &&
        smoothedHipKneeDy > MIN_HIP_BELOW_KNEE_DY &&
        isSymmetric &&
        isTorsoUpright;

      // Etat et feedback
      if (isDown) {
        downHoldFrames += 1;

        // Log lors de la première détection de descente
        if (downHoldFrames === 1) {
          console.log("🔵 DESCENTE detectee:", {
            angle: smoothedAngle.toFixed(1),
            hipKneeDy: smoothedHipKneeDy.toFixed(3),
            symmetric: isSymmetric,
            torsoUpright: isTorsoUpright,
          });
        }

        // Log quand la position est maintenue suffisamment
        if (downHoldFrames === MIN_DOWN_HOLD_FRAMES) {
          console.log("✅ POSITION BASSE validee (hold frames atteint):", {
            angle: smoothedAngle.toFixed(1),
            holdFrames: downHoldFrames,
          });
        }

        feedback =
          downHoldFrames >= MIN_DOWN_HOLD_FRAMES
            ? "Position basse OK  Remontez!"
            : "Descendez et maintenez";
        feedbackColor =
          downHoldFrames >= MIN_DOWN_HOLD_FRAMES ? "#00FF00" : "#FFA500";
        squatStage = "down";
        currentSquatForm = smoothedAngle; // angle minimal observé au bas
      } else if (isUp && isSymmetric && isTorsoUpright) {
        feedback = "Debout - Descendez!";
        feedbackColor = "#00FF00";

        // Validation d'une rep: on était en bas avec hold suffisant puis on est remonté, cooldown respecté
        if (squatStage === "down" && downHoldFrames >= MIN_DOWN_HOLD_FRAMES) {
          console.log("🟢 MONTEE detectee - Validation du squat:", {
            previousStage: squatStage,
            holdFrames: downHoldFrames,
            angle: smoothedAngle.toFixed(1),
          });

          const cooldownOk = now - lastRepTs > MIN_REP_INTERVAL_MS;
          console.log("⏱️  Cooldown check:", {
            cooldownOk,
            timeSinceLastRep: (now - lastRepTs).toFixed(0) + "ms",
            required: MIN_REP_INTERVAL_MS + "ms",
          });

          if (cooldownOk) {
            const isGoodForm = checkSquatForm(
              currentSquatForm ?? smoothedAngle,
              smoothedHipKneeDy
            );
            console.log("🏋️ SQUAT VALIDE:", {
              formQuality: isGoodForm ? "BONNE FORME" : "TO IMPROVE",
              kneeAngle: (currentSquatForm ?? smoothedAngle).toFixed(1),
              hipKneeDy: smoothedHipKneeDy.toFixed(3),
              totalSquats: totalSquats + 1,
            });

            onSquatDetected(isGoodForm);
            console.log("✨ SQUAT INCREMENTE - Total:", totalSquats);
            lastRepTs = now;
          } else {
            console.log("⚠️  Squat ignore (cooldown non respecté)");
          }
        }
        // reset pour cycle suivant
        squatStage = "up";
        downHoldFrames = 0;
        currentSquatForm = null;
      } else {
        // zone intermédiaire ou problème de posture
        if (!isSymmetric) {
          feedback = "Pliez les deux genoux symetriquement!";
          feedbackColor = "#FF6B6B";
        } else if (!isTorsoUpright) {
          feedback = "Gardez le torse droit!";
          feedbackColor = "#FF6B6B";
        } else {
          feedback = "Controlez la descente/montee";
          feedbackColor = "#FFFF00";
        }
      }

      // Afficher le feedback
      canvasCtx.fillStyle = feedbackColor;
      canvasCtx.font = "bold 32px Arial";
      canvasCtx.strokeText(feedback, 10, 210);
      canvasCtx.fillText(feedback, 10, 210);

      // Indication de profondeur du squat
      if (smoothedAngle < 140 && smoothedAngle > 90) {
        const depth = smoothedAngle < 100 ? "Profond" : "Moyen";
        canvasCtx.fillStyle = "#FFFFFF";
        canvasCtx.font = "24px Arial";
        canvasCtx.strokeText(`Profondeur: ${depth}`, 10, 250);
        canvasCtx.fillText(`Profondeur: ${depth}`, 10, 250);
      }

      // Message de félicitations si objectif atteint
      if (totalSquats >= TARGET_REPS) {
        canvasCtx.fillStyle = "#00FF00";
        canvasCtx.font = "bold 50px Arial";
        canvasCtx.strokeText("🎉 BRAVO! 🎉", 10, 290);
        canvasCtx.fillText("🎉 BRAVO! 🎉", 10, 290);
      }
    } else {
      // Points non détectés suffisamment (chevilles/genoux/hanche invisibles)
      // Afficher l'avertissement en bas du cadre pour meilleure visibilité
      const margin = 16;
      const lineHeight = 28;
      const boxHeight = lineHeight * 3 + margin;
      const boxY = canvasElement.height - boxHeight - 10; // 10px au-dessus du bas

      // Fond semi-transparent pour lisibilité
      canvasCtx.fillStyle = "rgba(0, 0, 0, 0.6)";
      canvasCtx.fillRect(0, boxY - 8, canvasElement.width, boxHeight);

      // Texte d'avertissement
      canvasCtx.fillStyle = "#FF4444";
      canvasCtx.strokeStyle = "#000000";
      canvasCtx.lineWidth = 2;
      canvasCtx.font = "bold 24px Arial";
      canvasCtx.textAlign = "left";
      canvasCtx.textBaseline = "top";

      const line1 = " Tenez-vous face a la camera";
      const line2 = "Les DEUX jambes doivent etre visibles";
      const line3 = "epaules, hanches, genoux, chevilles";

      canvasCtx.strokeText(line1, 10, boxY);
      canvasCtx.fillText(line1, 10, boxY);
      canvasCtx.strokeText(line2, 10, boxY + lineHeight);
      canvasCtx.fillText(line2, 10, boxY + lineHeight);
      canvasCtx.strokeText(line3, 10, boxY + lineHeight * 2);
      canvasCtx.fillText(line3, 10, boxY + lineHeight * 2);
    }
  } else {
    // Aucune pose détectée
    canvasCtx.fillStyle = "#FFFFFF";
    canvasCtx.font = "24px Arial";
    canvasCtx.fillText("Positionnez-vous devant la caméra", 10, 30);
  }
  if (totalSquats >= TARGET_REPS) {
    // Fond semi-transparent
    canvasCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Message principal
    canvasCtx.fillStyle = "#00FF00";
    canvasCtx.font = "bold 60px Arial";
    canvasCtx.textAlign = "center";
    canvasCtx.strokeStyle = "#000000";
    canvasCtx.lineWidth = 4;
    canvasCtx.strokeText(
      "🎉 OBJECTIF ATTEINT! 🎉",
      canvasElement.width / 2,
      canvasElement.height / 2 - 40
    );
    canvasCtx.fillText(
      "🎉 OBJECTIF ATTEINT! 🎉",
      canvasElement.width / 2,
      canvasElement.height / 2 - 40
    );

    // Statistiques
    canvasCtx.fillStyle = "#FFFFFF";
    canvasCtx.font = "bold 30px Arial";
    canvasCtx.strokeText(
      `${totalSquats} squats completed`,
      canvasElement.width / 2,
      canvasElement.height / 2 + 20
    );
    canvasCtx.fillText(
      `${totalSquats} squats completed`,
      canvasElement.width / 2,
      canvasElement.height / 2 + 20
    );

    const goodPercentage = Math.round((goodSquats / totalSquats) * 100);
    canvasCtx.fillStyle = "#00FF00";
    canvasCtx.font = "28px Arial";
    canvasCtx.strokeText(
      `Bonne forme: ${goodSquats} (${goodPercentage}%)`,
      canvasElement.width / 2,
      canvasElement.height / 2 + 70
    );
    canvasCtx.fillText(
      ` Bonne forme: ${goodSquats} (${goodPercentage}%)`,
      canvasElement.width / 2,
      canvasElement.height / 2 + 70
    );

    const badPercentage = Math.round((badSquats / totalSquats) * 100);
    canvasCtx.fillStyle = "#FF6B6B";
    canvasCtx.strokeText(
      `To improve: ${badSquats} (${badPercentage}%)`,
      canvasElement.width / 2,
      canvasElement.height / 2 + 110
    );
    canvasCtx.fillText(
      `To improve : ${badSquats} (${badPercentage}%)`,
      canvasElement.width / 2,
      canvasElement.height / 2 + 110
    );

    canvasCtx.textAlign = "left"; // Reset alignment
    canvasCtx.restore();
    return; // Arrêter le traitement
  }

  canvasCtx.restore();
});

// Configuration de la caméra
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});

// Démarrer la caméra
camera
  .start()
  .then(() => {
    // Ajuster la taille du canvas
    canvasElement.width = 640;
    canvasElement.height = 480;
    console.log("Caméra démarrée avec succès!");
    initializeDonutCharts();
  })
  .catch((error) => {
    console.error("Erreur lors du démarrage de la caméra:", error);
    canvasCtx.fillStyle = "#FFFFFF";
    canvasCtx.font = "20px Arial";
    canvasCtx.fillText("Erreur: Autorisez l'accès à la caméra", 10, 30);
  });
