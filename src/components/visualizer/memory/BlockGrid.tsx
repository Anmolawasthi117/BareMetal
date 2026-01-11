import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MemoryBlock } from '../../../store/useLabStore'

interface BlockGridProps {
  blocks: MemoryBlock[]
  language: string
  onBlockClick?: (block: MemoryBlock) => void
}

export default function BlockGrid({ blocks, language, onBlockClick }: BlockGridProps) {
  // Separate heap and stack blocks
  const heapBlocks = blocks.filter(b => b.type === 'heap')
  const stackBlocks = blocks.filter(b => b.type === 'stack')
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="h-full flex gap-12 p-4 relative">
      {/* SVG Layer for Pointers */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-neon-rust)" />
          </marker>
        </defs>
        {blocks.filter(b => b.pointsTo).map(block => {
          return (
            <PointerArrow 
              key={`ptr-${block.id}`} 
              fromId={block.id} 
              toId={block.pointsTo!} 
              containerRef={containerRef}
            />
          )
        })}
      </svg>

      {/* Stack Section */}
      <div className="flex-1 flex flex-col justify-end">
        <div className="text-[10px] font-code text-steel uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-go shadow-[0_0_8px_var(--color-neon-go)]" />
          STACK (LIFO)
        </div>
        <div className="bg-void-light/50 rounded-xl border-2 border-metal/30 p-6 relative overflow-hidden backdrop-blur-sm min-h-[400px]">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] text-steel/50 font-code uppercase tracking-tighter">
            High Address (0x7FFF...)
          </div>
          
          <div className="flex flex-col-reverse gap-3 mt-6">
            <AnimatePresence mode="popLayout">
              {stackBlocks.map((block) => (
                <MemoryBlockCard 
                  key={block.id} 
                  id={block.id}
                  block={block} 
                  language={language}
                  onClick={() => onBlockClick?.(block)}
                />
              ))}
            </AnimatePresence>
          </div>
          
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-steel/50 font-code uppercase tracking-tighter">
            Low Address (0x0000...)
          </div>
        </div>
      </div>

      {/* Heap Section */}
      <div className="flex-1 flex flex-col">
        <div className="text-[10px] font-code text-steel uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-rust shadow-[0_0_8px_var(--color-neon-rust)]" />
          HEAP (DYNAMIC)
        </div>
        <div className="flex-1 bg-void-light/50 rounded-xl border-2 border-metal/30 p-6 relative overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {heapBlocks.map((block) => (
                <MemoryBlockCard 
                  key={block.id} 
                  id={block.id}
                  block={block} 
                  language={language}
                  onClick={() => onBlockClick?.(block)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

// ARROW COMPONENT
function PointerArrow({ 
  fromId, 
  toId, 
  containerRef 
}: { 
  fromId: string, 
  toId: string, 
  containerRef: React.RefObject<HTMLDivElement | null> 
}) {
  const [coords, setCoords] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null)

  useEffect(() => {
    const updateCoords = () => {
      const fromEl = document.getElementById(fromId)
      const toEl = document.getElementById(toId)
      const containerEl = containerRef.current

      if (fromEl && toEl && containerEl) {
        const fromRect = fromEl.getBoundingClientRect()
        const toRect = toEl.getBoundingClientRect()
        const containerRect = containerEl.getBoundingClientRect()

        setCoords({
          x1: fromRect.right - containerRect.left,
          y1: fromRect.top + fromRect.height / 2 - containerRect.top,
          x2: toRect.left - containerRect.left,
          y2: toRect.top + toRect.height / 2 - containerRect.top
        })
      }
    }

    updateCoords()
    window.addEventListener('resize', updateCoords)
    const timeout = setTimeout(updateCoords, 100)
    return () => {
      window.removeEventListener('resize', updateCoords)
      clearTimeout(timeout)
    }
  }, [fromId, toId, containerRef])

  if (!coords) return null

  return (
    <motion.line
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      x1={coords.x1}
      y1={coords.y1}
      x2={coords.x2}
      y2={coords.y2}
      stroke="var(--color-neon-rust)"
      strokeWidth="2"
      strokeDasharray="4 2"
      markerEnd="url(#arrowhead)"
    />
  )
}

// Individual memory block component
function MemoryBlockCard({ 
  block, 
  language,
  id,
  onClick 
}: { 
  block: MemoryBlock
  language: string
  id?: string
  onClick?: () => void
}) {
  const getStatusColor = () => {
    switch (block.status) {
      case 'allocated': return 'border-neon-cpp bg-neon-cpp/20'
      case 'freed': return 'border-neon-go bg-neon-go/20'
      case 'leaked': return 'border-red-500 bg-red-500/20 animate-pulse'
      case 'garbage': return 'border-steel bg-steel/20'
      default: return 'border-metal bg-metal/20'
    }
  }

  const getStatusIcon = () => {
    switch (block.status) {
      case 'allocated': return '●'
      case 'freed': return '○'
      case 'leaked': return '💧'
      case 'garbage': return '🗑'
      default: return '?'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 0.5,
        transition: { duration: 0.3 }
      }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={`relative p-3 rounded border ${getStatusColor()} cursor-pointer transition-colors`}
    >
      {/* Address */}
      <div className="text-[10px] font-code text-steel mb-1">
        {block.address}
      </div>
      
      {/* Status Icon */}
      <div className="text-lg mb-1">{getStatusIcon()}</div>
      
      {/* Owner (for Rust) */}
      {block.owner && (
        <div className="text-xs font-code text-neon-rust truncate">
          → {block.owner}
        </div>
      )}
      
      {/* Ref Count (for Python) */}
      {language === 'python' && block.refCount !== undefined && (
        <motion.div
          key={block.refCount}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-neon-py text-void text-xs font-bold flex items-center justify-center"
        >
          {block.refCount}
        </motion.div>
      )}
      
      {/* Size */}
      <div className="text-[10px] font-code text-steel mt-1">
        {block.size} bytes
      </div>
    </motion.div>
  )
}

// Leaking pipe animation for C++
export function LeakIndicator() {
  return (
    <motion.div
      animate={{ 
        opacity: [0.5, 1, 0.5],
        y: [0, 2, 0]
      }}
      transition={{ duration: 1, repeat: Infinity }}
      className="flex items-center gap-2 text-red-500 text-sm font-code"
    >
      <span>💧</span>
      <span>MEMORY LEAK DETECTED</span>
    </motion.div>
  )
}

// GC Sweep animation
export function GCSweeper({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'linear' }}
          className="absolute inset-y-0 w-1 bg-gradient-to-b from-transparent via-neon-go to-transparent"
          style={{ boxShadow: '0 0 20px var(--color-neon-go)' }}
        />
      )}
    </AnimatePresence>
  )
}
