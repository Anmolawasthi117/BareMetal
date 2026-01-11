import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

// Typewriter texts
const TYPEWRITER_TEXTS = [
  "Code is just text until it's translated.",
  "Every language speaks to the machine differently.",
  "The compiler is your translator.",
  "The runtime is your execution engine.",
  "See the machine.",
]

// Lab cards data
const LABS = [
  {
    path: '/labs/compiler',
    title: 'THE COMPILER',
    subtitle: 'Translation Lab',
    description: 'Watch high-level code transform into machine instructions. See the difference between compiled and interpreted languages.',
    icon: '⚙',
    color: 'neon-cpp',
    gradient: 'from-blue-500/20 to-blue-900/20',
  },
  {
    path: '/labs/memory',
    title: 'THE MEMORY',
    subtitle: 'Memory Lab',
    description: 'Visualize heap vs stack, manual allocation vs garbage collection, and ownership models.',
    icon: '▦',
    color: 'neon-rust',
    gradient: 'from-orange-500/20 to-orange-900/20',
  },
  {
    path: '/labs/cost',
    title: 'THE COST',
    subtitle: 'Performance Lab',
    description: 'Understand the hidden runtime costs of "simple" operations across different languages.',
    icon: '$',
    color: 'neon-js',
    gradient: 'from-yellow-500/20 to-yellow-900/20',
  },
  {
    path: '/labs/concurrency',
    title: 'THE THREADS',
    subtitle: 'Concurrency Lab',
    description: 'Compare event loops, goroutines, and OS threads. See how different models handle parallel work.',
    icon: '≡',
    color: 'neon-go',
    gradient: 'from-cyan-500/20 to-cyan-900/20',
  },
  {
    path: '/labs/safety',
    title: 'THE CRASH',
    subtitle: 'Safety Lab',
    description: 'Explore what happens when things go wrong. Segfaults, panics, and how languages protect you.',
    icon: '⚠',
    color: 'neon-py',
    gradient: 'from-green-500/20 to-green-900/20',
  },
]

export default function Home() {
  const [currentText, setCurrentText] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  // Typewriter effect
  useEffect(() => {
    const text = TYPEWRITER_TEXTS[currentText]
    
    if (isTyping) {
      if (displayText.length < text.length) {
        const timer = setTimeout(() => {
          setDisplayText(text.slice(0, displayText.length + 1))
        }, 50)
        return () => clearTimeout(timer)
      } else {
        const timer = setTimeout(() => setIsTyping(false), 2000)
        return () => clearTimeout(timer)
      }
    } else {
      if (displayText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, 30)
        return () => clearTimeout(timer)
      } else {
        setCurrentText((prev) => (prev + 1) % TYPEWRITER_TEXTS.length)
        setIsTyping(true)
      }
    }
  }, [displayText, isTyping, currentText])

  return (
    <div className="min-h-full p-8">
      {/* Hero Section */}
      <section className="relative py-20 mb-16">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-neon-cpp/10 blur-3xl"
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-7xl font-display font-bold mb-6">
              <span className="text-chrome">BARE</span>
              <span className="text-neon-cpp text-glow-cpp">METAL</span>
            </h1>
            <p className="text-xl text-silver mb-12">The Ultimate Runtime Visualizer</p>
          </motion.div>

          {/* Typewriter Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="h-20 flex items-center justify-center mb-12"
          >
            <p className="text-2xl md:text-3xl font-code text-chrome">
              <span className="text-neon-go">&gt;</span>{' '}
              {displayText}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-3 h-6 ml-1 bg-neon-cpp align-middle"
              />
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link
              to="/labs/compiler"
              className="inline-flex items-center gap-3 px-8 py-4 bg-neon-cpp/10 border border-neon-cpp/50 rounded-lg text-neon-cpp font-code uppercase tracking-wider hover:bg-neon-cpp/20 hover:border-neon-cpp transition-all duration-300 group"
            >
              <span>Enter the Machine</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-xl"
              >
                →
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Labs Grid */}
      <section className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-steel font-code uppercase tracking-widest mb-8"
        >
          [ SELECT A LAB ]
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LABS.map((lab, index) => (
            <LabCard key={lab.path} lab={lab} index={index} />
          ))}
        </div>
      </section>

      {/* Bottom decorative line */}
      <div className="mt-20 flex items-center justify-center gap-4 text-steel">
        <div className="h-px w-20 bg-metal" />
        <span className="font-code text-xs">LOOKING UNDER THE HOOD</span>
        <div className="h-px w-20 bg-metal" />
      </div>
    </div>
  )
}

// Lab Card Component
function LabCard({ lab, index }: { lab: typeof LABS[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={lab.path}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="block h-full"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`relative h-full p-6 rounded-lg border border-metal bg-gradient-to-br ${lab.gradient} backdrop-blur-sm overflow-hidden group`}
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Glow effect on hover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className={`absolute inset-0 bg-gradient-to-br from-transparent via-${lab.color}/10 to-transparent`}
          />

          {/* Border glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 0.5 : 0 }}
            className={`absolute inset-0 rounded-lg border-2 border-${lab.color}`}
            style={{ boxShadow: `0 0 20px var(--color-${lab.color}-glow)` }}
          />

          {/* Icon */}
          <div className={`text-4xl mb-4 text-${lab.color}`}>{lab.icon}</div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-lg text-chrome">{lab.title}</h3>
              <motion.span
                animate={{ x: isHovered ? 5 : 0 }}
                className="text-steel group-hover:text-chrome transition-colors"
              >
                →
              </motion.span>
            </div>
            <p className={`text-xs font-code mb-3 text-${lab.color}`}>{lab.subtitle}</p>
            <p className="text-sm text-silver leading-relaxed">{lab.description}</p>
          </div>

          {/* Corner decoration */}
          <div className="absolute bottom-0 right-0 w-20 h-20 opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M100 0 L100 100 L0 100 Z" fill="currentColor" className={`text-${lab.color}`} />
            </svg>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
