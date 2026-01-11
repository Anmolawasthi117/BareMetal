import { ReactNode, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import HackerNavbar from './HackerNavbar'
import { useLabStore, LANGUAGE_CONFIG } from '../../store/useLabStore'

interface AppShellProps {
  children: ReactNode
}

// Lab navigation items
const NAV_ITEMS = [
  { path: '/', label: 'HOME', icon: '⌂', description: 'Story Mode' },
  { path: '/labs/compiler', label: 'COMPILER', icon: '⚙', description: 'Translation Lab' },
  { path: '/labs/memory', label: 'MEMORY', icon: '▦', description: 'Memory Lab' },
  { path: '/labs/cost', label: 'COST', icon: '$', description: 'Performance Lab' },
  { path: '/labs/concurrency', label: 'THREADS', icon: '≡', description: 'Concurrency Lab' },
  { path: '/labs/safety', label: 'SAFETY', icon: '⚠', description: 'Safety Lab' },
]

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const { language, setLanguage } = useLabStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen bg-void flex flex-col">
      {/* Top Navbar */}
      <HackerNavbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 60 : 240 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="bg-void-light border-r border-metal flex flex-col shrink-0"
        >
          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-10 flex items-center justify-center border-b border-metal hover:bg-metal/30 transition-colors"
          >
            <motion.span
              animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-silver text-sm"
            >
              ◀
            </motion.span>
          </button>

          {/* Navigation */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded transition-all duration-150 group relative overflow-hidden ${
                    isActive
                      ? 'bg-neon-cpp/10 text-neon-cpp border border-neon-cpp/30'
                      : 'text-silver hover:text-chrome hover:bg-metal/30 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator line */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-neon-cpp"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    
                    <span className="text-lg shrink-0 w-6 text-center">{item.icon}</span>
                    
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="flex flex-col"
                        >
                          <span className="font-code text-xs tracking-wider">{item.label}</span>
                          <span className="text-[10px] text-steel">{item.description}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Language Selector (only in labs) */}
          {!isHome && !sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 border-t border-metal"
            >
              <label className="block text-[10px] text-steel uppercase tracking-widest mb-2">
                Language
              </label>
              <div className="grid grid-cols-5 gap-1">
                {(Object.keys(LANGUAGE_CONFIG) as Array<keyof typeof LANGUAGE_CONFIG>).map((lang) => {
                  const config = LANGUAGE_CONFIG[lang]
                  return (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`p-2 rounded text-xs font-code transition-all duration-150 ${
                        language === lang
                          ? `bg-${config.color}/20 text-${config.color} border border-${config.color}/50`
                          : 'bg-metal/30 text-steel hover:text-chrome border border-transparent'
                      }`}
                      title={config.name}
                    >
                      {config.extension.toUpperCase()}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* System Info */}
          <div className="p-3 border-t border-metal">
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-code text-[10px] text-steel space-y-1"
                >
                  <div className="flex justify-between">
                    <span>VERSION</span>
                    <span className="text-neon-go">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>STATUS</span>
                    <span className="text-neon-py">ONLINE</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-void relative">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
          
          {/* Page content */}
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
