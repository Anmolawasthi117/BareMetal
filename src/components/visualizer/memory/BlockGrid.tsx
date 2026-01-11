import { motion, AnimatePresence } from 'framer-motion'
import { MemoryBlock } from '../../store/useLabStore'

interface BlockGridProps {
  blocks: MemoryBlock[]
  language: string
  onBlockClick?: (block: MemoryBlock) => void
}

export default function BlockGrid({ blocks, language, onBlockClick }: BlockGridProps) {
  // Separate heap and stack blocks
  const heapBlocks = blocks.filter(b => b.type === 'heap')
  const stackBlocks = blocks.filter(b => b.type === 'stack')

  return (
    <div className="h-full flex gap-6 p-4">
      {/* Stack Section */}
      <div className="flex-1 flex flex-col">
        <div className="text-[10px] font-code text-steel uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-go" />
          STACK (LIFO)
        </div>
        <div className="flex-1 bg-void-light rounded-lg border border-metal p-4 relative overflow-hidden">
          {/* Stack grows downward visualization */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-steel font-code">
            HIGH ADDRESS ↑
          </div>
          
          <div className="flex flex-col-reverse gap-2 mt-6">
            <AnimatePresence mode="popLayout">
              {stackBlocks.map((block) => (
                <MemoryBlockCard 
                  key={block.id} 
                  block={block} 
                  language={language}
                  onClick={() => onBlockClick?.(block)}
                />
              ))}
            </AnimatePresence>
          </div>
          
          {stackBlocks.length === 0 && (
            <div className="h-full flex items-center justify-center text-steel text-sm">
              Stack is empty
            </div>
          )}

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-steel font-code">
            ↓ LOW ADDRESS
          </div>
        </div>
      </div>

      {/* Heap Section */}
      <div className="flex-1 flex flex-col">
        <div className="text-[10px] font-code text-steel uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-rust" />
          HEAP (DYNAMIC)
        </div>
        <div className="flex-1 bg-void-light rounded-lg border border-metal p-4 relative overflow-hidden">
          <div className="grid grid-cols-4 gap-2">
            <AnimatePresence mode="popLayout">
              {heapBlocks.map((block) => (
                <MemoryBlockCard 
                  key={block.id} 
                  block={block} 
                  language={language}
                  onClick={() => onBlockClick?.(block)}
                />
              ))}
            </AnimatePresence>
          </div>
          
          {heapBlocks.length === 0 && (
            <div className="h-full flex items-center justify-center text-steel text-sm">
              Heap is empty
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Individual memory block component
function MemoryBlockCard({ 
  block, 
  language,
  onClick 
}: { 
  block: MemoryBlock
  language: string
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
