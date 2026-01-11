import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLabStore, LANGUAGE_CONFIG } from '../../store/useLabStore'
import logo from '../../assets/baremetal_logo.png'

export default function HackerNavbar() {
  const { language, isLoading, isSimulating } = useLabStore()
  const [time, setTime] = useState(new Date())
  const [glitch, setGlitch] = useState(false)

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Random glitch effect
  useEffect(() => {
    const glitchTimer = setInterval(() => {
      if (Math.random() > 0.95) {
        setGlitch(true)
        setTimeout(() => setGlitch(false), 150)
      }
    }, 2000)
    return () => clearInterval(glitchTimer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).replace(/\//g, '.')
  }

  const config = LANGUAGE_CONFIG[language]

  return (
    <header className="h-12 bg-void-light border-b border-metal flex items-center px-4 shrink-0 relative overflow-hidden">
      {/* Glitch overlay */}
      {glitch && (
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          className="absolute inset-0 bg-neon-cpp/10 pointer-events-none z-50"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59, 130, 246, 0.1) 2px, rgba(59, 130, 246, 0.1) 4px)'
          }}
        />
      )}

      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded border border-metal bg-void flex items-center justify-center overflow-hidden">
          <motion.img
            src={logo}
            alt="BareMetal Logo"
            className="w-5 h-5 object-contain"
            animate={{ rotate: isLoading ? 360 : 0 }}
            transition={{ duration: 2, repeat: isLoading ? Infinity : 0, ease: 'linear' }}
          />
        </div>
        <div>
          <h1 className="font-display font-bold text-chrome text-sm tracking-wider leading-none">
            BARE<span className="text-neon-cpp">METAL</span>
          </h1>
          <p className="text-[9px] text-steel tracking-widest">RUNTIME VISUALIZER</p>
        </div>
      </div>

      {/* Center Status */}
      <div className="flex-1 flex items-center justify-center gap-8">
        {/* Active Language */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-steel uppercase tracking-wider">LANG:</span>
          <span 
            className={`font-code text-xs font-bold text-${config.color}`}
            style={{ textShadow: `0 0 10px var(--color-${config.color}-glow)` }}
          >
            {config.name}
          </span>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4">
          <StatusIndicator
            label="CPU"
            value={isLoading ? 'BUSY' : 'IDLE'}
            active={isLoading}
          />
          <StatusIndicator
            label="MEM"
            value="OK"
            active={false}
          />
          <StatusIndicator
            label="SIM"
            value={isSimulating ? 'RUN' : 'STOP'}
            active={isSimulating}
          />
        </div>
      </div>

      {/* Right - Clock */}
      <div className="flex items-center gap-4 font-code text-xs">
        <div className="text-right">
          <div className="text-chrome tracking-widest">{formatTime(time)}</div>
          <div className="text-steel text-[10px]">{formatDate(time)}</div>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-metal bg-void">
          <motion.div
            animate={{ 
              backgroundColor: ['#22c55e', '#22c55e80', '#22c55e'],
              boxShadow: ['0 0 5px #22c55e', '0 0 10px #22c55e', '0 0 5px #22c55e']
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
          />
          <span className="text-neon-py text-[10px]">CONNECTED</span>
        </div>
      </div>
    </header>
  )
}

// Status Indicator Component
function StatusIndicator({ 
  label, 
  value, 
  active 
}: { 
  label: string
  value: string
  active: boolean 
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-steel">{label}:</span>
      <motion.span
        animate={{ opacity: active ? [1, 0.5, 1] : 1 }}
        transition={{ duration: 0.5, repeat: active ? Infinity : 0 }}
        className={`font-code text-[10px] font-bold ${
          active ? 'text-neon-rust' : 'text-neon-go'
        }`}
      >
        {value}
      </motion.span>
    </div>
  )
}
