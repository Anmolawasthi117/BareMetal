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

  if (!step) {
    return (
      <div className="p-4 rounded-lg border border-metal bg-void-light">
        <p className="text-steel text-sm text-center">
          Select a scenario and click "Next" to see step-by-step explanations
        </p>
      </div>
    )
  }

  const getActionIcon = (action: MemoryStep['action']) => {
    switch (action) {
      case 'allocate-heap': return '📦'
      case 'allocate-stack': return '📚'
      case 'free': return '🗑️'
      case 'leak': return '💧'
      case 'transfer-ownership': return '🔄'
      case 'add-reference': return '➕'
      case 'remove-reference': return '➖'
      case 'gc-mark': return '👻'
      case 'gc-sweep': return '🧹'
      case 'scope-enter': return '→'
      case 'scope-exit': return '←'
      default: return '•'
    }
  }

  const getActionLabel = (action: MemoryStep['action']) => {
    switch (action) {
      case 'allocate-heap': return 'HEAP ALLOCATION'
      case 'allocate-stack': return 'STACK ALLOCATION'
      case 'free': return 'MEMORY FREED'
      case 'leak': return 'MEMORY LEAK!'
      case 'transfer-ownership': return 'OWNERSHIP TRANSFER'
      case 'add-reference': return 'REFERENCE ADDED'
      case 'remove-reference': return 'REFERENCE REMOVED'
      case 'gc-mark': return 'MARKED AS GARBAGE'
      case 'gc-sweep': return 'GC SWEEP'
      case 'scope-enter': return 'EXECUTING'
      case 'scope-exit': return 'SCOPE EXIT'
      default: return 'ACTION'
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
        exit={{ opacity: 0, y: -10 }}
        className={`
          p-4 rounded-lg border transition-colors
          ${isWarning 
            ? 'border-red-500/50 bg-red-500/5' 
            : isSuccess 
              ? 'border-neon-go/50 bg-neon-go/5'
              : `border-${config.color}/30 bg-${config.color}/5`
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{getActionIcon(step.action)}</span>
          <div>
            <h4 className={`
              font-code text-xs font-bold uppercase tracking-wider
              ${isWarning ? 'text-red-400' : isSuccess ? 'text-neon-go' : `text-${config.color}`}
            `}>
              {getActionLabel(step.action)}
            </h4>
            <p className="text-[10px] text-steel">
              Line {step.lineNumber} • Step {stepNumber + 1} of {totalSteps}
            </p>
          </div>
        </div>

        {/* Code snippet */}
        <div className="bg-void rounded px-3 py-2 mb-3 border border-metal">
          <code className={`font-code text-sm text-${config.color}`}>
            {step.code}
          </code>
        </div>

        {/* Explanation */}
        <p className="text-sm text-silver leading-relaxed">
          {step.explanation}
        </p>

        {/* Size info if available */}
        {step.blockSize && (
          <div className="mt-3 flex items-center gap-2 text-[10px] font-code text-steel">
            <span className="px-2 py-1 rounded bg-metal/30">
              Size: {step.blockSize} bytes
            </span>
            {step.owner && (
              <span className="px-2 py-1 rounded bg-metal/30">
                Owner: {step.owner}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
