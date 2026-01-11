import { motion, AnimatePresence } from 'framer-motion'
import { MemoryStep } from '../../data/memoryScenarios'
import { LANGUAGE_CONFIG, Language } from '../../store/useLabStore'

interface ExplanationPanelProps {
  step: MemoryStep | null
  language: Language
  stepNumber: number
  totalSteps: number
}

export default function ExplanationPanel({ 
  step, 
  language,
  stepNumber,
  totalSteps 
}: ExplanationPanelProps) {
  const config = LANGUAGE_CONFIG[language]

  if (!step) return null

  const getActionIcon = (action: MemoryStep['action']) => {
    switch (action) {
      case 'allocate-heap': return '📦'
      case 'allocate-stack': return '📍'
      case 'free': return '🧹'
      case 'leak': return '💧'
      case 'transfer-ownership': return '🔄'
      case 'add-reference': return '🔗'
      case 'remove-reference': return '✂️'
      case 'gc-mark': return '👻'
      case 'gc-sweep': return '🗑️'
      case 'scope-enter': return '⚙️'
      case 'scope-exit': return '🚪'
      default: return '•'
    }
  }

  const getActionLabel = (action: MemoryStep['action']) => {
    switch (action) {
      case 'allocate-heap': return 'Heap Allocation'
      case 'allocate-stack': return 'Stack Variable'
      case 'free': return 'Deallocated'
      case 'leak': return 'Memory Leak!'
      case 'transfer-ownership': return 'Ownership Move'
      case 'add-reference': return 'Reference Created'
      case 'remove-reference': return 'Reference Removed'
      case 'gc-mark': return 'Marked for GC'
      case 'gc-sweep': return 'Garbage Collected'
      case 'scope-enter': return 'Entering Scope'
      case 'scope-exit': return 'Exiting Scope'
      default: return 'Memory Action'
    }
  }

  const isWarning = step.action === 'leak'
  const isSuccess = step.action === 'free'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${step.lineNumber}-${stepNumber}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`
          p-5 rounded-2xl border transition-all mt-6 relative overflow-hidden group
          ${isWarning 
            ? 'border-red-500/50 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
            : isSuccess 
              ? 'border-neon-go/50 bg-neon-go/5 shadow-[0_0_20px_rgba(45,212,191,0.1)]'
              : `border-${config.color}/30 bg-void shadow-inner`
          }
        `}
      >
        <div className={`absolute top-0 right-0 p-2 opacity-5 text-4xl pointer-events-none group-hover:scale-110 transition-transform`}>
          {getActionIcon(step.action)}
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg
            ${isWarning ? 'bg-red-500/20 text-red-500' : isSuccess ? 'bg-neon-go/20 text-neon-go' : `bg-${config.color}/20 text-${config.color}`}
          `}>
            {getActionIcon(step.action)}
          </div>
          <div>
            <h4 className={`
              font-display text-[11px] font-bold uppercase tracking-widest
              ${isWarning ? 'text-red-400' : isSuccess ? 'text-neon-go' : 'text-chrome'}
            `}>
              {getActionLabel(step.action)}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 opacity-60">
              <span className="text-[10px] font-code text-steel">
                LINE {String(step.lineNumber).padStart(2, '0')}
              </span>
              <span className="w-1 h-1 rounded-full bg-metal" />
              <span className="text-[10px] font-code text-steel uppercase">
                Phase {stepNumber + 1}
              </span>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="relative z-10">
          <p className="text-sm text-silver leading-relaxed font-medium">
            {step.explanation}
          </p>
        </div>

        {/* Size info if available */}
        {step.blockSize && (
          <div className="mt-4 flex items-center gap-3 relative z-10">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-void border border-metal/20 shadow-sm">
              <span className="text-[10px] font-code text-steel opacity-60 uppercase">Size</span>
              <span className="text-[10px] font-code text-chrome font-bold">{step.blockSize}B</span>
            </div>
            {step.owner && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-void border border-metal/20 shadow-sm">
                <span className="text-[10px] font-code text-steel opacity-60 uppercase">Owner</span>
                <span className={`text-[10px] font-code text-${config.color} font-bold`}>{step.owner}</span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
