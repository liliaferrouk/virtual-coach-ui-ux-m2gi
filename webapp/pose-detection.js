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
function checkSquatForm(kneeAngle) {
  // Good form: angle < 100° (deep squat)
  // Bad form: angle >= 100° and < 120° (shallow squat)
  return kneeAngle < 100;
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

  // Reinitialize donutty charts
  new Donutty(donutGood);
  new Donutty(donutBad);
}

// Call this function when a squat is detected
function onSquatDetected(isGoodForm) {
  totalSquats++;
  if (isGoodForm) {
    goodSquats++;
  } else {
    badSquats++;
  }
  updateProgressCard();
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

    // Utiliser le côté gauche pour la détection
    if (landmarks[23] && landmarks[25] && landmarks[27]) {
      // Angle du genou: hanche-genou-cheville
      const kneeAngle = calculateAngle(
        landmarks[23],
        landmarks[25],
        landmarks[27]
      );

      // Afficher l'angle sur le canvas
      canvasCtx.fillStyle = "#FFFFFF";
      canvasCtx.font = "28px Arial";
      canvasCtx.strokeStyle = "#000000";
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeText(`Angle genou: ${Math.round(kneeAngle)}°`, 10, 40);
      canvasCtx.fillText(`Angle genou: ${Math.round(kneeAngle)}°`, 10, 40);

      // Afficher le compteur
      canvasCtx.fillStyle = "#FFFF00";
      canvasCtx.font = "bold 40px Arial";
      canvasCtx.strokeText(`Squats: ${totalSquats}/${TARGET_REPS}`, 10, 90);
      canvasCtx.fillText(`Squats: ${totalSquats}/${TARGET_REPS}`, 10, 90);

      let feedback = "";
      let feedbackColor = "#FFFFFF";
      let currentSquatForm = null;

      if (kneeAngle > 160) {
        // Position debout - position de départ
        if (squatStage === "down") {
          // Compter une répétition complète (après être remonté)
          const isGoodForm = checkSquatForm(currentSquatForm || kneeAngle);
          onSquatDetected(isGoodForm);
        }
        squatStage = "up";
        currentSquatForm = null;
        feedback = "Debout - Descendez!";
        feedbackColor = "#00FF00";
      } else if (kneeAngle < 100 && squatStage === "up") {
        // Position squat profonde - excellent!
        squatStage = "down";
        currentSquatForm = kneeAngle;
        feedback = "Parfait! Remontez!";
        feedbackColor = "#00FF00";
      } else if (kneeAngle >= 100 && kneeAngle < 120 && squatStage === "up") {
        // Position squat correcte
        squatStage = "down";
        currentSquatForm = kneeAngle;
        feedback = "Bon squat! Remontez!";
        feedbackColor = "#90EE90";
      } else if (kneeAngle >= 120 && kneeAngle < 140) {
        // Position intermédiaire
        if (squatStage === "up") {
          feedback = "Descendez plus bas!";
          feedbackColor = "#FFA500";
        } else {
          feedback = "Remontez!";
          feedbackColor = "#FFFF00";
        }
      } else if (kneeAngle >= 140 && kneeAngle <= 160) {
        // Presque debout
        feedback = "Presque debout!";
        feedbackColor = "#FFFF00";
      }

      // Afficher le feedback
      canvasCtx.fillStyle = feedbackColor;
      canvasCtx.font = "bold 32px Arial";
      canvasCtx.strokeText(feedback, 10, 140);
      canvasCtx.fillText(feedback, 10, 140);

      // Indication de profondeur du squat
      if (kneeAngle < 140 && kneeAngle > 90) {
        const depth = kneeAngle < 100 ? "Profond" : "Moyen";
        canvasCtx.fillStyle = "#FFFFFF";
        canvasCtx.font = "24px Arial";
        canvasCtx.strokeText(`Profondeur: ${depth}`, 10, 180);
        canvasCtx.fillText(`Profondeur: ${depth}`, 10, 180);
      }

      // Message de félicitations si objectif atteint
      if (totalSquats >= TARGET_REPS) {
        canvasCtx.fillStyle = "#00FF00";
        canvasCtx.font = "bold 50px Arial";
        canvasCtx.strokeText("🎉 BRAVO! 🎉", 10, 220);
        canvasCtx.fillText("🎉 BRAVO! 🎉", 10, 220);
      }
    } else {
      // Points non détectés
      canvasCtx.fillStyle = "#FF0000";
      canvasCtx.font = "24px Arial";
      canvasCtx.fillText("⚠️ Mettez-vous debout face à la caméra", 10, 40);
      canvasCtx.fillText("Assurez-vous d'être visible en entier", 10, 70);
    }
  } else {
    // Aucune pose détectée
    canvasCtx.fillStyle = "#FFFFFF";
    canvasCtx.font = "24px Arial";
    canvasCtx.fillText("Positionnez-vous devant la caméra", 10, 30);
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
  })
  .catch((error) => {
    console.error("Erreur lors du démarrage de la caméra:", error);
    canvasCtx.fillStyle = "#FFFFFF";
    canvasCtx.font = "20px Arial";
    canvasCtx.fillText("Erreur: Autorisez l'accès à la caméra", 10, 30);
  });


