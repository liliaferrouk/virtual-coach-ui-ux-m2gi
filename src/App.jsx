import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

const basename = import.meta.env.PROD ? '/virtual-coach-ui-ux-m2gi' : ''
import { AuthProvider } from './context/AuthContext'
import { WorkoutProvider } from './context/WorkoutContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import WorkoutBuilder from './pages/WorkoutBuilder'
import ActiveWorkout from './pages/ActiveWorkout'
import History from './pages/History'
import Profile from './pages/Profile'
import Nutrition from './pages/Nutrition'

function App() {
  return (
    <AuthProvider>
      <WorkoutProvider>
        <Router basename={basename}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="workout-builder" element={<WorkoutBuilder />} />
              <Route path="active-workout" element={<ActiveWorkout />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
              <Route path="nutrition" element={<Nutrition />} />
            </Route>
          </Routes>
        </Router>
      </WorkoutProvider>
    </AuthProvider>
  )
}

export default App
