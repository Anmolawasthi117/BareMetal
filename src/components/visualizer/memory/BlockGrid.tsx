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
      <div className="flex-1 flex flex-col justify-end max-w-[300px]">
        <div className="text-[10px] font-code text-steel uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-go shadow-[0_0_8px_var(--color-neon-go)]" />
          STACK (LIFO)
        </div>
        <div className="bg-void-light/50 rounded-2xl border border-metal/30 p-8 relative overflow-hidden backdrop-blur-sm min-h-[450px] flex flex-col items-center shadow-inner">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] text-steel/40 font-code uppercase tracking-widest whitespace-nowrap">
            High Address
          </div>
          
          <div className="flex flex-col-reverse gap-4 mt-8 w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              {stackBlocks.length > 0 ? stackBlocks.map((block) => (
                <MemoryBlockCard 
                  key={block.id} 
                  id={block.id}
                  block={block} 
                  language={language}
                  onClick={() => onBlockClick?.(block)}
                />
              )) : (
                <div className="text-[10px] text-steel/20 font-code text-center py-10 italic">
                  Stack Empty
                </div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-steel/40 font-code uppercase tracking-widest whitespace-nowrap">
            Low Address
          </div>
        </div>
      </div>

      {/* Heap Section */}
      <div className="flex-1 flex flex-col">
        <div className="text-[10px] font-code text-steel uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-rust shadow-[0_0_8px_var(--color-neon-rust)]" />
          HEAP (DYNAMIC)
        </div>
        <div className="flex-1 bg-void-light/50 rounded-2xl border border-metal/30 p-8 relative overflow-hidden backdrop-blur-sm shadow-inner overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {heapBlocks.length > 0 ? heapBlocks.map((block) => (
                <MemoryBlockCard 
                  key={block.id} 
                  id={block.id}
                  block={block} 
                  language={language}
                  onClick={() => onBlockClick?.(block)}
                />
              )) : (
                <div className="col-span-full h-full flex flex-col items-center justify-center py-20 opacity-20 grayscale">
                  <div className="text-4xl mb-4">🧊</div>
                  <p className="text-[10px] font-code uppercase tracking-widest text-steel">Heap Unallocated</p>
                </div>
              )}
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
          x2: toRect.left - containerRect.left + 4, // Slight offset for better visual
          y2: toRect.top + toRect.height / 2 - containerRect.top
        })
      }
    }

    updateCoords()
    window.addEventListener('resize', updateCoords)
    const timeout = setTimeout(updateCoords, 150) // More buffer for popLayout
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
      exit={{ opacity: 0 }}
      x1={coords.x1}
      y1={coords.y1}
      x2={coords.x2}
      y2={coords.y2}
      stroke="var(--color-neon-rust)"
      strokeWidth="1.5"
      strokeDasharray="6 3"
      markerEnd="url(#arrowhead)"
      className="filter drop-shadow-[0_0_3px_var(--color-neon-rust)]"
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
  const getStatusStyles = () => {
    switch (block.status) {
      case 'allocated': return 'border-neon-cpp/50 bg-neon-cpp/10 shadow-[0_0_10px_rgba(45,212,191,0.05)]'
      case 'freed': return 'border-neon-go/30 bg-neon-go/5 opacity-60 grayscale-[0.5]'
      case 'leaked': return 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse'
      case 'garbage': return 'border-steel/20 bg-steel/5 opacity-40'
      default: return 'border-metal/30 bg-metal/10'
    }
  }

  const getPointerGlow = () => {
    if (block.pointsTo) return ' ring-1 ring-neon-rust/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
    return ''
  }

  return (
    <motion.div
      layout
      id={id}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ 
        opacity: 0, 
        scale: 0.8,
        transition: { duration: 0.2 }
      }}
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
      onClick={onClick}
      className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${getStatusStyles()} ${getPointerGlow()}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-code text-steel/80 tracking-tighter">
          {block.address}
        </span>
        <span className={`text-[8px] font-code px-1.5 py-0.5 rounded ${
          block.type === 'stack' ? 'bg-neon-go/20 text-neon-go' : 'bg-neon-rust/20 text-neon-rust'
        }`}>
          {block.type}
        </span>
      </div>
      
      <div className="flex items-end justify-between">
        <div className="flex-1 min-w-0">
          {block.owner ? (
            <div className="text-xs font-code font-bold text-chrome truncate flex items-center gap-1.5 capitalize">
              <span className="text-neon-rust opacity-60">•</span> {block.owner}
            </div>
          ) : (
            <div className="text-xs font-code text-steel/50 italic capitalize">
              Anonymous
            </div>
          )}
          <div className="text-[10px] font-code text-steel mt-1 opacity-60">
            {block.size} bytes
          </div>
        </div>

        {language === 'python' && block.refCount !== undefined && (
          <motion.div
            key={block.refCount}
            initial={{ scale: 1.5, rotate: 15 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-5 h-5 rounded-md bg-neon-py text-void text-[10px] font-bold flex items-center justify-center shadow-lg"
          >
            {block.refCount}
          </motion.div>
        )}
      </div>

      {block.status === 'leaked' && (
        <div className="absolute -top-1 -right-1 text-xs">💧</div>
      )}
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
