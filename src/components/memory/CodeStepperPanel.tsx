import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MemoryStep } from '../../data/memoryScenarios'
import { LANGUAGE_CONFIG, Language } from '../../store/useLabStore'

interface CodeStepperPanelProps {
  title: string
  icon: string
  language: Language
  code: string
  steps: MemoryStep[]
  currentStep: number
  totalSteps: number
  onPrevStep: () => void
  onNextStep: () => void
  onReset: () => void
  isPlaying: boolean
  onPlayPause: () => void
}

export default function CodeStepperPanel({
  title,
  icon,
  language,
  code,
  steps,
  currentStep,
  totalSteps,
  onPrevStep,
  onNextStep,
  onReset,
  isPlaying,
  onPlayPause,
}: CodeStepperPanelProps) {
  const config = LANGUAGE_CONFIG[language]
  const codeRef = useRef<HTMLPreElement>(null)

  // Auto-scroll to highlighted line
  useEffect(() => {
    if (codeRef.current && currentStep < steps.length) {
      const lineNumber = steps[currentStep].lineNumber
      const lines = codeRef.current.querySelectorAll('.code-line')
      if (lines[lineNumber - 1]) {
        lines[lineNumber - 1].scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentStep, steps])

  const currentStepData = steps[currentStep]
  const highlightedLine = currentStepData?.lineNumber || -1

  return (
    <div className="h-full flex flex-col bg-void-light rounded-lg border border-metal overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-metal bg-${config.color}/5`}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <h3 className={`font-code text-sm font-bold text-${config.color}`}>
              {title}
            </h3>
            <p className="text-[10px] text-steel">{config.name}</p>
          </div>
        </div>
        <div className="text-[10px] font-code text-steel">
          Step {currentStep + 1} of {totalSteps}
        </div>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto p-4">
        <pre ref={codeRef} className="font-code text-xs leading-relaxed">
          {code.split('\n').map((line, idx) => (
            <motion.div
              key={idx}
              animate={{
                backgroundColor: highlightedLine === idx + 1 
                  ? `var(--color-${config.color})20` 
                  : 'transparent',
                x: highlightedLine === idx + 1 ? 4 : 0,
              }}
              className={`
                code-line px-2 py-0.5 rounded transition-colors
                ${highlightedLine === idx + 1 
                  ? `border-l-2 border-${config.color}` 
                  : 'border-l-2 border-transparent'
                }
              `}
            >
              <span className="inline-block w-6 text-steel/50 select-none">
                {idx + 1}
              </span>
              <span className={highlightedLine === idx + 1 ? 'text-chrome' : 'text-silver'}>
                {line || ' '}
              </span>
            </motion.div>
          ))}
        </pre>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-metal bg-void">
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded border border-metal text-steel text-xs font-code hover:bg-metal/30 transition-colors"
          title="Reset"
        >
          ↺ Reset
        </button>
        
        <div className="flex-1" />
        
        <button
          onClick={onPrevStep}
          disabled={currentStep === 0}
          className="px-3 py-1.5 rounded border border-metal text-silver text-xs font-code hover:bg-metal/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        
        <button
          onClick={onPlayPause}
          className={`
            px-4 py-1.5 rounded border font-code text-xs transition-colors
            ${isPlaying 
              ? 'border-red-500 text-red-400 bg-red-500/10 hover:bg-red-500/20' 
              : `border-${config.color} text-${config.color} bg-${config.color}/10 hover:bg-${config.color}/20`
            }
          `}
        >
          {isPlaying ? '■ Pause' : '▶ Play'}
        </button>
        
        <button
          onClick={onNextStep}
          disabled={currentStep >= totalSteps - 1}
          className={`
            px-3 py-1.5 rounded border font-code text-xs transition-colors
            border-${config.color} text-${config.color} hover:bg-${config.color}/20
            disabled:opacity-30 disabled:cursor-not-allowed
          `}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
