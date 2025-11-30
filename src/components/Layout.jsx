import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-[var(--color-bg-dark)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-bg-dark)]/95 backdrop-blur-sm border-b border-white/10 safe-area-inset">
        <div className="flex items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VC</span>
            </div>
            <span className="font-semibold text-lg hidden sm:block">Virtual Coach</span>
          </NavLink>

          <NavLink
            to="/profile"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            {isAuthenticated ? (
              <span className="text-sm font-medium">U</span>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </NavLink>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-[88px]">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-bg-card)]/95 backdrop-blur-sm border-t border-white/10 safe-area-inset">
        <div className="flex justify-around py-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                isActive ? 'text-[var(--color-primary)] bg-white/5' : 'text-white/60 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-xs">Home</span>
                {isActive && (
                  <span className="absolute -top-1 w-8 h-1 rounded-full bg-[var(--color-primary)]/80" />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/workout-builder"
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                isActive ? 'text-[var(--color-primary)] bg-white/5' : 'text-white/60 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-xs">Create</span>
                {isActive && (
                  <span className="absolute -top-1 w-8 h-1 rounded-full bg-[var(--color-primary)]/80" />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                isActive ? 'text-[var(--color-primary)] bg-white/5' : 'text-white/60 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-xs">History</span>
                {isActive && (
                  <span className="absolute -top-1 w-8 h-1 rounded-full bg-[var(--color-primary)]/80" />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/nutrition"
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                isActive ? 'text-[var(--color-primary)] bg-white/5' : 'text-white/60 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-xs">Nutrition</span>
                {isActive && (
                  <span className="absolute -top-1 w-8 h-1 rounded-full bg-[var(--color-primary)]/80" />
                )}
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
