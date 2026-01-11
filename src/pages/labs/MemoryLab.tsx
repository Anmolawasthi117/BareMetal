import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLabStore, LANGUAGE_CONFIG } from '../../store/useLabStore'
import { LanguageSelector } from '../../components/editor/MonacoWrapper'
import ScenarioSelector from '../../components/memory/ScenarioSelector'
import CodeStepperPanel from '../../components/memory/CodeStepperPanel'
import ExplanationPanel from '../../components/memory/ExplanationPanel'
import BlockGrid, { LeakIndicator, GCSweeper } from '../../components/visualizer/memory/BlockGrid'
import { MEMORY_SCENARIOS, getScenarioById, MemoryStep } from '../../data/memoryScenarios'

export default function MemoryLab() {
  const { 
    language,
    memoryBlocks,
    addMemoryBlock,
    removeMemoryBlock,
    updateMemoryBlock,
    currentMemoryScenario,
    currentMemoryStep,
    setMemoryScenario,
    nextMemoryStep,
    prevMemoryStep,
    resetMemoryScenario,
  } = useLabStore()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [gcActive, setGcActive] = useState(false)
  const [showScenarioPanel, setShowScenarioPanel] = useState(true)
  const playIntervalRef = useRef<number | null>(null)
  
  const config = LANGUAGE_CONFIG[language]
  const scenario = currentMemoryScenario ? getScenarioById(currentMemoryScenario) : null
  
  // Get language-specific implementation
  const implementation = scenario?.implementations[language]
  const steps = implementation?.steps || []
  const currentStepData = steps[currentMemoryStep] || null

  // Auto-select first scenario on mount
  useEffect(() => {
    if (!currentMemoryScenario && MEMORY_SCENARIOS.length > 0) {
      setMemoryScenario(MEMORY_SCENARIOS[0].id)
    }
  }, [currentMemoryScenario, setMemoryScenario])

  // Process step action when step changes
  useEffect(() => {
    if (!currentStepData) return
    executeStepAction(currentStepData)
  }, [currentMemoryStep, currentStepData])

  // Execute the memory action for a step
  const executeStepAction = useCallback((step: MemoryStep) => {
    const blockId = step.blockId || `block-${Date.now()}`
    
    switch (step.action) {
      case 'allocate-heap':
        addMemoryBlock({
          id: blockId,
          address: `0x${Math.random().toString(16).substr(2, 8).toUpperCase()}`,
          size: step.blockSize || 64,
          status: 'allocated',
          type: 'heap',
          owner: step.owner,
          refCount: language === 'python' ? 1 : undefined,
        })
        break
        
      case 'allocate-stack':
        addMemoryBlock({
          id: blockId,
          address: `0x${Math.random().toString(16).substr(2, 8).toUpperCase()}`,
          size: step.blockSize || 32,
          status: 'allocated',
          type: 'stack',
          owner: step.owner,
        })
        break
        
      case 'free':
        if (step.blockId) {
          // Animate to freed then remove
          updateMemoryBlock(step.blockId, { status: 'freed' })
          setTimeout(() => removeMemoryBlock(step.blockId!), 800)
        }
        break
        
      case 'leak':
        if (step.blockId) {
          updateMemoryBlock(step.blockId, { status: 'leaked' })
        }
        break
        
      case 'transfer-ownership':
        if (step.blockId && step.targetOwner) {
          updateMemoryBlock(step.blockId, { owner: step.targetOwner })
        }
        break
        
      case 'add-reference':
        if (step.blockId) {
          const block = useLabStore.getState().memoryBlocks.find(b => b.id === step.blockId)
          if (block && block.refCount !== undefined) {
            updateMemoryBlock(step.blockId, { refCount: block.refCount + 1 })
          }
        }
        break
        
      case 'remove-reference':
        if (step.blockId) {
          const block = useLabStore.getState().memoryBlocks.find(b => b.id === step.blockId)
          if (block && block.refCount !== undefined) {
            const newCount = block.refCount - 1
            updateMemoryBlock(step.blockId, { refCount: newCount })
            if (newCount <= 0) {
              setTimeout(() => removeMemoryBlock(step.blockId!), 800)
            }
          }
        }
        break
        
      case 'gc-mark':
        if (step.blockId) {
          updateMemoryBlock(step.blockId, { status: 'garbage' })
        }
        break
        
      case 'gc-sweep':
        setGcActive(true)
        setTimeout(() => {
          const blocks = useLabStore.getState().memoryBlocks
          blocks
            .filter(b => b.status === 'garbage')
            .forEach(b => removeMemoryBlock(b.id))
          setGcActive(false)
        }, 1500)
        break
    }
  }, [addMemoryBlock, updateMemoryBlock, removeMemoryBlock, language])

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      playIntervalRef.current = window.setInterval(() => {
        if (currentMemoryStep < steps.length - 1) {
          nextMemoryStep()
        } else {
          setIsPlaying(false)
        }
      }, 2000)
    }
    
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [isPlaying, currentMemoryStep, steps.length, nextMemoryStep])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setIsPlaying(false)
    resetMemoryScenario()
  }

  const handleSelectScenario = (id: string) => {
    setIsPlaying(false)
    setMemoryScenario(id)
    setShowScenarioPanel(false)
  }

  const hasLeak = memoryBlocks.some(b => b.status === 'leaked')

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-chrome flex items-center gap-3">
              <span className="text-3xl">▦</span>
              THE MEMORY LAB
            </h1>
            <p className="text-silver text-sm mt-1">
              Step through code and watch memory management in action
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowScenarioPanel(!showScenarioPanel)}
              className={`
                px-3 py-1.5 rounded border font-code text-xs transition-colors
                ${showScenarioPanel 
                  ? `border-${config.color} text-${config.color} bg-${config.color}/10` 
                  : 'border-metal text-steel hover:border-steel'
                }
              `}
            >
              {showScenarioPanel ? '✕ Close' : '📚 Scenarios'}
            </button>
            <LanguageSelector />
          </div>
        </div>

        {/* Mode indicator */}
        {scenario && (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-4 p-3 rounded-lg border border-${config.color}/30 bg-${config.color}/5`}
          >
            <span className="text-2xl">{scenario.icon}</span>
            <div className="flex-1">
              <h3 className={`font-code text-sm font-bold text-${config.color}`}>
                {scenario.title}
              </h3>
              <p className="text-[10px] text-steel">{scenario.description}</p>
            </div>
            {hasLeak && <LeakIndicator />}
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Scenario Panel (collapsible sidebar) */}
        <AnimatePresence>
          {showScenarioPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="w-[280px] h-full bg-void-light rounded-lg border border-metal p-4 overflow-y-auto">
                <ScenarioSelector
                  language={language}
                  currentScenario={currentMemoryScenario}
                  onSelectScenario={handleSelectScenario}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Code Stepper Panel */}
        <div className="w-1/3 min-w-[300px]">
          {scenario && implementation ? (
            <CodeStepperPanel
              title={scenario.title}
              icon={scenario.icon}
              language={language}
              code={implementation.code}
              steps={steps}
              currentStep={currentMemoryStep}
              totalSteps={steps.length}
              onPrevStep={prevMemoryStep}
              onNextStep={nextMemoryStep}
              onReset={handleReset}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-void-light rounded-lg border border-metal">
              <p className="text-steel text-sm">Select a scenario to begin</p>
            </div>
          )}
        </div>

        {/* Memory Visualization */}
        <div className="flex-1 min-w-0 relative">
          <BlockGrid 
            blocks={memoryBlocks} 
            language={language}
            onBlockClick={() => {}}
          />
          <GCSweeper active={gcActive} />
        </div>
      </div>

      {/* Explanation Panel */}
      <div className="mt-4">
        <ExplanationPanel
          step={currentStepData}
          language={language}
          stepNumber={currentMemoryStep}
          totalSteps={steps.length}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-code text-steel">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-neon-cpp bg-neon-cpp/20" />
          Allocated
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-neon-go bg-neon-go/20" />
          Freed
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-red-500 bg-red-500/20" />
          Leaked
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-steel bg-steel/20" />
          Garbage
        </div>
      </div>
    </div>
  )
}
