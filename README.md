# Virtual Coach — AI-Powered Fitness Trainer

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-FF6B6B)
![PWA](https://img.shields.io/badge/PWA-Ready-05667B)
![License](https://img.shields.io/badge/License-MIT-green)

> A real-time AI fitness coaching web app that uses your camera to analyze your workout form, count reps, and guide you through personalized training sessions — all running entirely in the browser, no backend required.

---

## Features

- **Real-Time Pose Detection** — MediaPipe tracks your body landmarks live via webcam and analyzes form for 8+ exercises
- **AI Rep Counter & Form Feedback** — Automatically counts reps and distinguishes good vs. bad form with voice cues
- **Workout Builder** — 3-step wizard to create custom workouts by muscle group (chest, back, legs, arms, core, cardio)
- **Active Workout Mode** — Live camera feed with pose skeleton overlay, timer, rep tracker, sensitivity controls, and auto-advance
- **Voice & Haptic Feedback** — Text-to-speech encouragement and vibration alerts during sessions
- **Workout History & Analytics** — Track completed sessions with duration, total reps, form quality %, and personal ratings
- **Personalized Nutrition Guidance** — Tips adapted to your fitness level with pre/post workout meal suggestions
- **User Authentication** — Sign up / log in with local data persistence per account
- **Progressive Web App (PWA)** — Installable on mobile, works offline

---

## Supported Exercises

| Exercise | Tracked Metrics |
|---|---|
| Squats | Knee angle, torso lean, depth |
| Push-ups | Elbow angle, body alignment |
| Lunges | Knee depth, shin vertical, torso upright |
| Planks | Hip alignment, body angle, hold time |
| Crunches | Shoulder-to-hip distance, knee bend |
| Tricep Dips | Elbow angle and range |
| High Knees | Knee height relative to hip |
| Jumping Jacks | Arm height above shoulders |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + React Router 7 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 4 |
| AI / CV | MediaPipe Pose |
| State Management | React Context API |
| Data Persistence | localStorage |
| PWA | vite-plugin-pwa |
| Linting | ESLint 9 (flat config) |

---

## Demo

<video src="ui%20ux%20projet%20demo.mp4" controls width="100%"></video>

> If the video doesn't render, [click here to download and watch it](ui%20ux%20projet%20demo.mp4).

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A modern browser with WebRTC support (Chrome or Edge recommended for best MediaPipe performance)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/liliaferrouk/virtual-coach-ui-ux-m2gi.git
cd virtual-coach-ui-ux-m2gi

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open your browser at **http://localhost:5173**

> **Camera access is required.** When prompted, allow the browser to use your webcam to enable pose detection.

### Other Commands

```bash
npm run build     # Production build → dist/
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
```

---

## Project Structure

```
src/
├── components/
│   ├── Layout.jsx          # App shell: header + bottom navigation
│   └── PoseDetection.jsx   # Core AI component — MediaPipe pose analysis
├── context/
│   ├── AuthContext.jsx     # User auth state & localStorage persistence
│   └── WorkoutContext.jsx  # Workout data, history, preferences & stats
├── pages/
│   ├── Home.jsx            # Dashboard with recent workouts & quick start
│   ├── WorkoutBuilder.jsx  # 3-step custom workout creation wizard
│   ├── ActiveWorkout.jsx   # Live workout with pose detection & timer
│   ├── History.jsx         # Workout history & performance analytics
│   ├── Profile.jsx         # Account management & fitness preferences
│   └── Nutrition.jsx       # Personalized nutrition tips
├── index.css               # Design tokens, Tailwind, custom utilities
└── main.jsx                # React entry point
```

---

## How It Works

1. **Create a workout** — select muscle groups, pick exercises, set rep targets
2. **Start your session** — the app activates your camera and loads MediaPipe Pose
3. **Train in real time** — the model tracks 33 body landmarks at ~30 fps, computes joint angles, and evaluates each rep
4. **Get feedback** — voice cues and on-screen alerts guide your form; the rep counter updates automatically
5. **Review your progress** — completed workouts are saved with full stats to your history

---

## UX Theory Applied

This project was designed with established HCI (Human-Computer Interaction) principles studied during the course:

### Norman's Action Cycle
Donald Norman's interaction model describes how a user forms a **goal**, executes an **action**, and then **evaluates** the result through the interface. A key concept is bridging the **Gulf of Evaluation** — the user must be able to clearly perceive whether their action had the intended effect.

In Virtual Coach, this is addressed directly: after each rep, the app immediately tells the user whether their form was correct or not, both **visually** (on-screen message with color coding) and **vocally** (text-to-speech feedback). The user never has to guess if they did it right.

### CARE Framework
The CARE model defines quality criteria for human-computer interfaces:
- **C**ohérence — consistent visual language and interaction patterns throughout the app
- **A**daptabilité — sensitivity levels (lenient / normal / strict) adapt to the user's skill level
- **R**étroaction (Feedback) — multimodal feedback: on-screen text, color indicators, and voice alerts after every rep
- **E**xplicabilité — clear labels, progress indicators, and form tips explain what is expected at every step

---

## Academic Context

This project was developed as a **group project** as part of a **Master's degree in Software Engineering (M2GI)** at Université Grenoble Alpes. It focuses on applying UI/UX principles to a real-world AI-powered web application, demonstrating front-end architecture, computer vision integration, and mobile-first design.

---

## License

MIT — see [LICENSE](LICENSE) for details.