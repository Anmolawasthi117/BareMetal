import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLabStore, LANGUAGE_CONFIG, Task, Language } from '../../store/useLabStore'
import { LanguageSelector } from '../../components/editor/MonacoWrapper'
import ConcurrencyScenarioSelector from '../../components/concurrency/ConcurrencyScenarioSelector'
import TimelineVisualization from '../../components/concurrency/TimelineVisualization'
import CodeComparisonPanel from '../../components/concurrency/CodeComparisonPanel'
import AnalogyPanel from '../../components/concurrency/AnalogyPanel'
import { 
  ConcurrencyScenario, 
  CONCURRENCY_SCENARIOS, 
  getScenarioById, 
  getModelForLanguage,
  ConcurrencyModel 
} from '../../data/concurrencyScenarios'

export default function ConcurrencyLab() {
  const { 
    language, 
    tasks, 
    addTask, 
    updateTask, 
    clearTasks,
    currentConcurrencyScenario,
    setConcurrencyScenario,
  } = useLabStore()
  
  const [isRunning, setIsRunning] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [metrics, setMetrics] = useState<{ totalTime: number; efficiency: number; memoryOverhead: string } | null>(null)
  
  const simulationRef = useRef<number>()
  const taskIdRef = useRef(0)
  
  const config = LANGUAGE_CONFIG[language]
  const scenario = currentConcurrencyScenario ? getScenarioById(currentConcurrencyScenario) : null
  const implementation = scenario ? getModelForLanguage(scenario, language) : null
  const currentModel: ConcurrencyModel | null = implementation?.model || null

  // Get number of lanes based on model
  const getLanes = () => {
    if (!currentModel) return 1
    switch (currentModel) {
      case 'event-loop': return 1
      case 'goroutines': return 4
      case 'threads': return 4
      case 'async-await': return 4
      case 'multiprocessing': return 4
      default: return 1
    }
  }

  // Calculate total scenario duration
  const getTotalDuration = () => {
    if (!scenario) return 5000
    const maxDuration = Math.max(...scenario.tasks.map(t => t.duration))
    
    // For parallel models, time is roughly max task duration
    // For event loop, it's sum of all durations if blocking
    if (currentModel === 'event-loop') {
      const hasBlocking = scenario.tasks.some(t => t.blocksEventLoop)
      if (hasBlocking) {
        return scenario.tasks.reduce((sum, t) => sum + t.duration, 0)
      }
    }
    return maxDuration + 1000
  }

  // Auto-select first scenario on mount
  useEffect(() => {
    if (!currentConcurrencyScenario && CONCURRENCY_SCENARIOS.length > 0) {
      setConcurrencyScenario(CONCURRENCY_SCENARIOS[0].id)
    }
  }, [currentConcurrencyScenario, setConcurrencyScenario])

  // Initialize tasks when scenario or language changes
  useEffect(() => {
    if (!scenario || !implementation) return
    
    clearTasks()
    setCurrentTime(0)
    setIsRunning(false)
    setMetrics(null)
    taskIdRef.current = 0
    
    // Create tasks from scenario
    const lanes = getLanes()
    scenario.tasks.forEach((taskDef, index) => {
      const task: Task = {
        id: `task-${taskIdRef.current++}`,
        name: taskDef.name,
        status: 'queued',
        lane: currentModel === 'event-loop' ? 0 : index % lanes,
        duration: taskDef.duration,
      }
      addTask(task)
    })
  }, [scenario?.id, language, implementation])

  // Run simulation
  const runSimulation = useCallback(() => {
    if (isRunning || !scenario) return
    setIsRunning(true)
    setCurrentTime(0)

    const startTime = Date.now()
    const lanes = getLanes()

    const simulate = () => {
      const elapsed = Date.now() - startTime
      setCurrentTime(elapsed)

      // Get current tasks state
      const currentTasks = useLabStore.getState().tasks

      currentTasks.forEach((task) => {
        if (task.status === 'queued') {
          // Determine if task can start
          let canStart = false
          
          if (currentModel === 'event-loop') {
            // Event loop: only one task at a time
            const anyRunning = currentTasks.some(t => t.status === 'running')
            canStart = !anyRunning
          } else if (currentModel === 'goroutines') {
            // Goroutines: can start many concurrently (lightweight)
            canStart = true
          } else {
            // Threads: limited by lane availability
            const laneRunning = currentTasks.some(
              t => t.lane === task.lane && t.status === 'running'
            )
            canStart = !laneRunning
          }
          
          if (canStart) {
            updateTask(task.id, { status: 'running', startTime: elapsed })
          }
        } else if (task.status === 'running' && task.startTime !== undefined) {
          // Check if task completed
          if (elapsed - task.startTime >= task.duration) {
            updateTask(task.id, { status: 'completed' })
          }
          
          // Event loop blocking for heavy tasks
          if (currentModel === 'event-loop') {
            const taskDef = scenario.tasks.find(t => t.name === task.name)
            if (taskDef?.blocksEventLoop && elapsed - task.startTime > 100) {
              // Just let it complete, it blocks everything else
            }
          }
        }
      })

      // Continue or stop
      const allComplete = currentTasks.every(t => t.status === 'completed')
      if (!allComplete && elapsed < 30000) {
        simulationRef.current = requestAnimationFrame(simulate)
      } else {
        setIsRunning(false)
        
        // Calculate metrics
        const totalDuration = elapsed
        const idealTime = scenario.tasks.reduce((sum, t) => Math.max(sum, t.duration), 0)
        const efficiency = Math.round((idealTime / totalDuration) * 100)
        
        setMetrics({
          totalTime: totalDuration,
          efficiency: Math.min(efficiency, 100),
          memoryOverhead: currentModel === 'goroutines' ? 'Low (2KB/task)' : 
                          currentModel === 'threads' ? 'High (1MB/thread)' : 
                          'Minimal'
        })
      }
    }

    simulationRef.current = requestAnimationFrame(simulate)
  }, [isRunning, scenario, currentModel, updateTask])

  // Stop simulation
  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      cancelAnimationFrame(simulationRef.current)
    }
    setIsRunning(false)
  }, [])

  // Reset
  const reset = useCallback(() => {
    stopSimulation()
    setCurrentTime(0)
    setMetrics(null)
    
    // Reset all tasks to queued
    tasks.forEach(task => {
      updateTask(task.id, { status: 'queued', startTime: undefined })
    })
  }, [stopSimulation, tasks, updateTask])

  const handleSelectScenario = (id: string) => {
    setIsRunning(false)
    setConcurrencyScenario(id)
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-chrome flex items-center gap-3">
              <span className="text-3xl">≡</span>
              THE CONCURRENCY LAB
            </h1>
            <p className="text-silver text-sm mt-1">
              See how different languages handle parallel work
            </p>
          </div>
          <LanguageSelector />
        </div>

        {/* Scenario Selector */}
        <ConcurrencyScenarioSelector
          currentScenario={currentConcurrencyScenario}
          onSelectScenario={handleSelectScenario}
        />
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-4 mb-4 px-4 py-3 bg-void-light rounded-lg border border-metal">
        <button
          onClick={isRunning ? stopSimulation : runSimulation}
          disabled={tasks.length === 0}
          className={`
            px-5 py-2 rounded border font-code text-sm uppercase transition-all
            ${isRunning
              ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30'
              : `bg-${config.color}/20 border-${config.color} text-${config.color} hover:bg-${config.color}/30`
            } disabled:opacity-50
          `}
        >
          {isRunning ? '■ Stop' : '▶ Run Simulation'}
        </button>
        
        <button
          onClick={reset}
          className="px-4 py-2 bg-metal/30 border border-metal rounded text-steel font-code text-sm uppercase hover:bg-metal/50 transition-colors"
        >
          Reset
        </button>

        <div className="ml-auto flex items-center gap-4 text-xs font-code text-steel">
          <span>Tasks: {tasks.length}</span>
          <span>Lanes: {getLanes()}</span>
          {implementation && (
            <span className={`px-2 py-1 rounded bg-${config.color}/10 text-${config.color}`}>
              {implementation.model.replace('-', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-4">
        {/* Code Panel */}
        <div className="col-span-1">
          {scenario && (
            <CodeComparisonPanel
              implementations={scenario.languages}
              selectedLanguage={language}
            />
          )}
        </div>

        {/* Timeline Visualization */}
        <div className="col-span-2">
          <TimelineVisualization
            tasks={tasks}
            model={currentModel || 'event-loop'}
            lanes={getLanes()}
            currentTime={currentTime}
            isRunning={isRunning}
            totalDuration={getTotalDuration()}
          />
        </div>
      </div>

      {/* Analogy Panel */}
      <div className="mt-4">
        <AnalogyPanel
          scenario={scenario}
          language={language}
          currentModel={currentModel}
          metrics={metrics || undefined}
        />
      </div>
    </div>
  )
}
