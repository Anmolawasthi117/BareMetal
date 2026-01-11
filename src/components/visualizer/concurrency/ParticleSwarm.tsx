import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Particle {
  id: number
  x: number
  y: number
  targetLane: number
  speed: number
  color: string
}

interface ParticleSwarmProps {
  particleCount: number
  lanes: number
  active: boolean
}

export default function ParticleSwarm({ particleCount, lanes, active }: ParticleSwarmProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()

  // Initialize particles
  useEffect(() => {
    if (!active) return

    const laneHeight = 50
    const colors = ['#06b6d4', '#3b82f6', '#22c55e', '#f97316', '#eab308']

    particlesRef.current = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * (lanes * laneHeight),
      targetLane: Math.floor(Math.random() * lanes),
      speed: 0.5 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
  }, [particleCount, lanes, active])

  // Animation loop
  useEffect(() => {
    if (!active || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const laneHeight = canvas.height / lanes

    const animate = () => {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw lane backgrounds
      for (let i = 0; i < lanes; i++) {
        ctx.strokeStyle = '#27272a'
        ctx.beginPath()
        ctx.moveTo(0, i * laneHeight)
        ctx.lineTo(canvas.width, i * laneHeight)
        ctx.stroke()
      }

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Move towards target lane
        const targetY = particle.targetLane * laneHeight + laneHeight / 2
        particle.y += (targetY - particle.y) * 0.1

        // Move horizontally
        particle.x += particle.speed
        if (particle.x > canvas.width) {
          particle.x = -5
          particle.targetLane = Math.floor(Math.random() * lanes)
        }

        // Randomly reassign lane (context switch)
        if (Math.random() < 0.01) {
          particle.targetLane = Math.floor(Math.random() * lanes)
        }

        // Draw particle with glow
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()

        // Glow effect
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 6, 0, Math.PI * 2)
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, 6
        )
        gradient.addColorStop(0, `${particle.color}40`)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [active, lanes])

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="relative h-full w-full bg-void rounded-lg border border-metal overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-void/80 border-b border-metal flex items-center px-4 z-10">
        <span className="text-[10px] font-code text-steel uppercase tracking-widest">
          Goroutine Swarm
        </span>
        <span className="ml-auto text-[10px] font-code text-neon-go">
          {particleCount} goroutines • {lanes} CPUs
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 mt-8"
      />

      {/* Lane labels */}
      <div className="absolute left-2 top-10 bottom-2 flex flex-col justify-around pointer-events-none">
        {[...Array(lanes)].map((_, i) => (
          <div key={i} className="text-[10px] font-code text-steel">
            CPU {i}
          </div>
        ))}
      </div>

      {/* Stats overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.5 }}
        className="absolute bottom-4 right-4 bg-void/80 p-3 rounded border border-metal"
      >
        <div className="text-[10px] font-code space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-steel">Active:</span>
            <span className="text-neon-go">{particleCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-steel">CPUs:</span>
            <span className="text-neon-cpp">{lanes}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-steel">Scheduler:</span>
            <span className="text-neon-js">M:N</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Heavy thread spawn animation for C++
export function ThreadSpawnAnimation({ 
  spawning,
  threadId 
}: { 
  spawning: boolean
  threadId: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={spawning ? { 
        opacity: [0, 1, 1, 0],
        scale: [0.8, 1, 1, 1.1],
      } : { opacity: 0 }}
      transition={{ duration: 2 }}
      className="absolute inset-0 flex items-center justify-center bg-void/80 z-20"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-neon-cpp border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-neon-cpp font-code text-sm">
          Creating Thread #{threadId}...
        </p>
        <p className="text-steel text-xs mt-1">
          OS Context Switch
        </p>
      </div>
    </motion.div>
  )
}
