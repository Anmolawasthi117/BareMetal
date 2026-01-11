import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TetherLineProps {
  from: { x: number; y: number }
  to: { x: number; y: number }
  active: boolean
  color?: string
}

export default function TetherLine({ from, to, active, color = '#f97316' }: TetherLineProps) {
  const pathRef = useRef<SVGPathElement>(null)

  // Calculate control points for a curved line
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const curve = Math.abs(to.y - from.y) * 0.3

  const path = `M ${from.x} ${from.y} Q ${midX} ${midY - curve} ${to.x} ${to.y}`

  return (
    <AnimatePresence>
      {active && (
        <motion.svg
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ zIndex: 100 }}
        >
          {/* Glow effect */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Main line */}
          <motion.path
            ref={pathRef}
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            exit={{ pathLength: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
          
          {/* Animated dot along the path */}
          <motion.circle
            r={4}
            fill={color}
            animate={{
              offsetDistance: ['0%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              offsetPath: `path('${path}')`,
            }}
          />
          
          {/* Arrow at the end */}
          <motion.polygon
            points={`${to.x - 5},${to.y - 5} ${to.x + 5},${to.y} ${to.x - 5},${to.y + 5}`}
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  )
}

// Ownership visualization for Rust
interface OwnershipVisualizerProps {
  transfers: Array<{
    id: string
    from: { id: string; label: string }
    to: { id: string; label: string }
    active: boolean
  }>
}

export function OwnershipVisualizer({ transfers }: OwnershipVisualizerProps) {
  return (
    <div className="relative">
      <AnimatePresence>
        {transfers.map((transfer) => (
          <motion.div
            key={transfer.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`flex items-center gap-3 p-2 rounded ${
              transfer.active ? 'bg-neon-rust/10' : 'bg-metal/20'
            }`}
          >
            {/* From variable */}
            <motion.div
              animate={{ opacity: transfer.active ? 0.5 : 1 }}
              className={`px-2 py-1 rounded border font-code text-xs ${
                transfer.active 
                  ? 'border-steel text-steel line-through' 
                  : 'border-neon-rust text-neon-rust'
              }`}
            >
              {transfer.from.label}
            </motion.div>
            
            {/* Arrow */}
            <motion.div
              animate={{ x: transfer.active ? [0, 5, 0] : 0 }}
              transition={{ duration: 0.5, repeat: transfer.active ? Infinity : 0 }}
              className="text-neon-rust"
            >
              →→
            </motion.div>
            
            {/* To variable/function */}
            <div className={`px-2 py-1 rounded border font-code text-xs ${
              transfer.active 
                ? 'border-neon-rust text-neon-rust' 
                : 'border-metal text-steel'
            }`}>
              {transfer.to.label}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Borrow checker visualization
interface BorrowVisualizerProps {
  borrows: Array<{
    id: string
    variable: string
    borrowType: 'immutable' | 'mutable'
    scope: string
  }>
}

export function BorrowVisualizer({ borrows }: BorrowVisualizerProps) {
  return (
    <div className="space-y-2">
      {borrows.map((borrow) => (
        <motion.div
          key={borrow.id}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0 }}
          className={`p-2 rounded border font-code text-xs flex items-center gap-2 ${
            borrow.borrowType === 'mutable'
              ? 'border-neon-rust bg-neon-rust/10 text-neon-rust'
              : 'border-neon-go bg-neon-go/10 text-neon-go'
          }`}
        >
          <span className="font-bold">
            {borrow.borrowType === 'mutable' ? '&mut' : '&'}
          </span>
          <span>{borrow.variable}</span>
          <span className="text-steel ml-auto">{borrow.scope}</span>
        </motion.div>
      ))}
    </div>
  )
}
