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
    <div className="h-full flex flex-col bg-void-light/40 rounded-2xl border border-metal/30 overflow-hidden backdrop-blur-sm shadow-xl">
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b border-metal/30 bg-gradient-to-r from-${config.color}/10 to-transparent`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-void border border-${config.color}/30 flex items-center justify-center text-lg shadow-inner`}>
            {icon}
          </div>
          <div>
            <h3 className={`font-display text-[11px] font-bold text-chrome uppercase tracking-wider`}>
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full bg-${config.color} shadow-[0_0_5px_var(--color-${config.color})]`} />
              <p className="text-[9px] text-steel font-code uppercase opacity-70">{config.name} Source</p>
            </div>
          </div>
        </div>
        <div className="text-[9px] font-code text-steel/60 bg-void/50 px-2 py-1 rounded-md border border-metal/20">
          {currentStep + 1} <span className="mx-0.5">/</span> {totalSteps}
        </div>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-void/20">
        <pre ref={codeRef} className="font-code text-[11px] leading-[1.8] text-silver/90">
          {code.split('\n').map((line, idx) => (
            <motion.div
              key={idx}
              animate={{
                backgroundColor: highlightedLine === idx + 1 
                  ? `var(--color-${config.color})15` 
                  : 'transparent',
                x: highlightedLine === idx + 1 ? 4 : 0,
                opacity: highlightedLine === idx + 1 ? 1 : 0.6
              }}
              className={`
                code-line px-3 py-0.5 rounded-md transition-all group relative
                ${highlightedLine === idx + 1 
                  ? `border-l-2 border-${config.color}` 
                  : 'border-l-2 border-transparent'
                }
              `}
            >
              {highlightedLine === idx + 1 && (
                <div className={`absolute inset-0 bg-gradient-to-r from-${config.color}/5 to-transparent pointer-events-none rounded-md`} />
              )}
              <span className="inline-block w-8 text-steel/30 select-none font-bold">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className={`
                ${highlightedLine === idx + 1 ? 'text-chrome font-medium' : 'text-silver/80'}
                transition-colors duration-300
              `}>
                {line || ' '}
              </span>
            </motion.div>
          ))}
        </pre>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-metal/20 bg-void-light/60 backdrop-blur-md">
        <button
          onClick={onReset}
          className="p-2 rounded-lg border border-metal/30 text-steel text-xs font-code hover:bg-void hover:text-silver hover:border-metal transition-all active:scale-95"
          title="Reset"
        >
          ↺
        </button>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevStep}
            disabled={currentStep === 0}
            className="w-10 h-8 flex items-center justify-center rounded-lg border border-metal/30 text-silver text-sm hover:bg-void hover:border-metal transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
          >
            ←
          </button>
          
          <button
            onClick={onPlayPause}
            className={`
              w-24 h-8 rounded-lg border font-code text-xs font-bold transition-all active:scale-95 shadow-lg
              ${isPlaying 
                ? 'border-red-500/50 text-red-500 bg-red-500/10 hover:bg-red-500/20 shadow-red-500/10' 
                : `border-${config.color}/50 text-${config.color} bg-${config.color}/10 hover:bg-${config.color}/20 shadow-${config.color}/10`
              }
            `}
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          
          <button
            onClick={onNextStep}
            disabled={currentStep >= totalSteps - 1}
            className={`
              w-10 h-8 flex items-center justify-center rounded-lg border font-bold transition-all active:scale-95
              border-${config.color}/50 text-${config.color} bg-${config.color}/5 hover:bg-${config.color}/20
              disabled:opacity-20 disabled:cursor-not-allowed
            `}
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
