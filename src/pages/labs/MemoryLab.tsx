import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLabStore, LANGUAGE_CONFIG, MemoryBlock } from '../../store/useLabStore'
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
    setMemoryBlocks,
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

  /**
   * RECONSTRUCT STATE
   * Instead of executing single actions, we rebuild the entire memory state
   * from Step 0 to currentStep. This handles stepping backward and language
   * switching seamlessly.
   */
  const reconstructState = useCallback((toStepIndex: number) => {
    if (!steps.length) return

    let currentBlocks: MemoryBlock[] = []
    
    // Process all steps up to the target index
    for (let i = 0; i <= toStepIndex; i++) {
        const step = steps[i]
        const blockId = step.blockId || `stable-id-${i}-${step.action}`
        
        switch (step.action) {
          case 'allocate-heap':
            currentBlocks.push({
              id: blockId,
              address: `0x${(0x70000000 + (i * 0x1000)).toString(16).toUpperCase()}`, // Stable addresses
              size: step.blockSize || 64,
              status: 'allocated',
              type: 'heap',
              owner: step.owner,
              pointsTo: step.pointsTo,
              refCount: language === 'python' ? 1 : undefined,
            })
            break
            
          case 'allocate-stack':
            currentBlocks.push({
              id: blockId,
              address: `0x${(0x04000000 + (i * 0x100)).toString(16).toUpperCase()}`, // Stable addresses
              size: step.blockSize || 32,
              status: 'allocated',
              type: 'stack',
              owner: step.owner,
              pointsTo: step.pointsTo,
            })
            break
            
          case 'free':
            if (step.blockId) {
              currentBlocks = currentBlocks.filter(b => b.id !== step.blockId)
            }
            break
            
          case 'leak':
            if (step.blockId) {
              currentBlocks = currentBlocks.map(b => 
                b.id === step.blockId ? { ...b, status: 'leaked' as const } : b
              )
            }
            break
            
          case 'transfer-ownership':
            if (step.blockId && step.targetOwner) {
              currentBlocks = currentBlocks.map(b => 
                b.id === step.blockId ? { ...b, owner: step.targetOwner } : b
              )
            }
            break
            
          case 'add-reference':
            if (step.blockId) {
              currentBlocks = currentBlocks.map(b => 
                (b.id === step.blockId && b.refCount !== undefined) 
                  ? { ...b, refCount: b.refCount + 1 } 
                  : b
              )
            }
            break
            
          case 'remove-reference':
            if (step.blockId) {
              currentBlocks = currentBlocks.map(b => {
                if (b.id === step.blockId && b.refCount !== undefined) {
                    const newCount = b.refCount - 1
                    return { ...b, refCount: Math.max(0, newCount) }
                }
                return b
              }).filter(b => b.refCount === undefined || b.refCount > 0)
            }
            break
            
          case 'gc-mark':
            if (step.blockId) {
              currentBlocks = currentBlocks.map(b => 
                b.id === step.blockId ? { ...b, status: 'garbage' as const } : b
              )
            }
            break
            
          case 'gc-sweep':
            currentBlocks = currentBlocks.filter(b => b.status !== 'garbage')
            break
        }
    }

    setMemoryBlocks(currentBlocks)
  }, [steps, language, setMemoryBlocks])

  // Sync state when step or language changes
  useEffect(() => {
    reconstructState(currentMemoryStep)
  }, [currentMemoryStep, language, reconstructState])

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
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <div className="flex items-center justify-between mb-4">
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
                px-4 py-2 rounded-lg border font-code text-xs transition-all flex items-center gap-2
                ${showScenarioPanel 
                  ? `border-${config.color} text-${config.color} bg-${config.color}/10 shadow-[0_0_10px_var(--color-${config.color})/0.2]` 
                  : 'border-metal text-steel hover:border-steel hover:bg-white/5'
                }
              `}
            >
              {showScenarioPanel ? '✕ Close Panel' : '📚 Select Scenario'}
            </button>
            <LanguageSelector />
          </div>
        </div>

        {/* Language & Scenario Info Banner */}
        <motion.div
          key={language + (currentMemoryScenario || '')}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border border-${config.color}/30 bg-void-light/50 backdrop-blur-md relative overflow-hidden group`}
        >
          <div className={`absolute inset-0 bg-gradient-to-r from-${config.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
          <div className="flex items-center gap-5 relative z-10">
            <div className={`w-12 h-12 rounded-xl bg-void border border-${config.color}/30 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
              {scenario?.icon || '📦'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className={`font-display text-base font-bold text-chrome uppercase tracking-wide`}>
                  {scenario?.title || 'Initialization'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full border border-${config.color}/30 bg-${config.color}/10 text-[10px] font-code text-${config.color} uppercase`}>
                  {config.name} Mode
                </span>
              </div>
              <p className="text-steel text-xs mt-1 max-w-2xl">{scenario?.description}</p>
            </div>
            {hasLeak && <LeakIndicator />}
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden">
        {/* Scenario Panel (collapsible sidebar) */}
        <AnimatePresence>
          {showScenarioPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0, x: -20 }}
              animate={{ width: 300, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: -20 }}
              className="shrink-0 h-full"
            >
              <div className="w-[300px] h-full bg-void-light/40 rounded-2xl border border-metal/30 p-5 overflow-y-auto backdrop-blur-sm shadow-inner">
                <ScenarioSelector
                  language={language}
                  currentScenario={currentMemoryScenario}
                  onSelectScenario={handleSelectScenario}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central Layout: Code + Visualizer */}
        <div className="flex-1 flex gap-6 min-w-0">
          {/* Code Stepper (Left Column of Center) */}
          <div className="w-[400px] shrink-0 flex flex-col h-full overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col">
              {scenario && implementation ? (
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  <div className="flex-1 min-h-0">
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
                  </div>
                  <div className="shrink-0 overflow-visible">
                    <ExplanationPanel 
                      step={currentStepData}
                      language={language}
                      stepNumber={currentMemoryStep}
                      totalSteps={steps.length}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-void-light/30 rounded-2xl border border-metal/20 border-dashed">
                  <div className="text-4xl mb-4 opacity-20">📚</div>
                  <p className="text-steel text-sm font-code">Select a scenario to begin</p>
                </div>
              )}
            </div>
          </div>

          {/* Visualization & Concept Guide (Right Column of Center) */}
          <div className="flex-1 flex flex-col gap-6 min-w-0 h-full">
            {/* Memory Viz */}
            <div className="flex-1 bg-void-light/20 rounded-2xl border border-metal/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,100,255,0.03),transparent_70%)] pointer-events-none" />
              <BlockGrid 
                blocks={memoryBlocks} 
                language={language}
                onBlockClick={() => {}}
              />
              <GCSweeper active={gcActive} />
              
              {/* Legend Overlay (integrated) */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6 py-2 px-6 rounded-full border border-metal/30 bg-void/80 backdrop-blur-md text-[9px] font-code text-steel uppercase tracking-widest z-20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm border border-neon-cpp bg-neon-cpp/20 shadow-[0_0_8px_var(--color-neon-cpp)/0.3]" />
                  Active
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm border border-neon-go bg-neon-go/20 shadow-[0_0_8px_var(--color-neon-go)/0.3]" />
                  Freed
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm border border-red-500 bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse" />
                  Leak
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm border border-steel bg-steel/10" />
                  Garbage
                </div>
                <div className="w-px h-3 bg-metal/30 mx-2" />
                <div className="text-neon-rust italic opacity-80">
                  Arrows ➔ Pointers
                </div>
              </div>
            </div>

            {/* Concept Guide & Info Bottom Panel */}
            <div className="h-48 shrink-0 flex gap-6">
              <div className="flex-1 bg-void-light/40 rounded-2xl border border-metal/30 p-5 flex flex-col overflow-hidden">
                <h4 className="text-[10px] font-code text-steel font-bold mb-3 flex items-center gap-2 uppercase tracking-widest border-b border-metal/20 pb-2">
                  <span>💡</span> Concept Guide
                </h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  <ConceptItem 
                    title="Manual Management" 
                    active={language === 'cpp'}
                    description="Manual 'free' required. Forgetful coding leads to leaks."
                  />
                  <ConceptItem 
                    title="Garbage Collection" 
                    active={['python', 'javascript', 'go'].includes(language)}
                    description="Auto 'sweeps' unreachable memory."
                  />
                  <ConceptItem 
                    title="Ownership System" 
                    active={language === 'rust'}
                    description="Safety without GC via strict owner rules."
                  />
                  <ConceptItem 
                    title="Stack vs Heap" 
                    active={true}
                    description="Stack is fast/orderly; Heap is long-lived/dynamic."
                  />
                </div>
              </div>
              
              {/* Interaction Hint */}
              <div className="w-48 shrink-0 bg-void/30 rounded-2xl border border-metal/10 border-dashed flex flex-col items-center justify-center p-4 text-center">
                <div className="text-xl mb-2 opacity-30">🖐️</div>
                <p className="text-[10px] text-steel font-code leading-relaxed">
                  Hover over blocks to see addresses and size details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConceptItem({ title, active, description }: { title: string, active: boolean, description: string }) {
  return (
    <div className={`transition-opacity ${active ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}>
      <h5 className="text-[11px] font-code font-bold mb-1 text-chrome uppercase">{title}</h5>
      <p className="text-[10px] text-steel leading-relaxed">{description}</p>
    </div>
  )
}
