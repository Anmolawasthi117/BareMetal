import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LaneTrack, { EventQueue } from '../../components/visualizer/concurrency/LaneTrack'
import ParticleSwarm, { ThreadSpawnAnimation } from '../../components/visualizer/concurrency/ParticleSwarm'
import { LanguageSelector } from '../../components/editor/MonacoWrapper'
import { useLabStore, Task, LANGUAGE_CONFIG } from '../../store/useLabStore'

type ConcurrencyMode = 'event-loop' | 'goroutines' | 'threads'

const MODE_INFO: Record<ConcurrencyMode, { 
  title: string
  desc: string
  lang: string
  lanes: number
}> = {
  'event-loop': { 
    title: 'JavaScript Event Loop', 
    desc: 'Single-threaded, non-blocking I/O with task queuing',
    lang: 'javascript',
    lanes: 1
  },
  'goroutines': { 
    title: 'Go Goroutines', 
    desc: 'M:N scheduling - thousands of lightweight tasks on few OS threads',
    lang: 'go',
    lanes: 4
  },
  'threads': { 
    title: 'C++ OS Threads', 
    desc: '1:1 mapping - heavy threads with kernel scheduling',
    lang: 'cpp',
    lanes: 4
  },
}

const TASK_PRESETS = [
  { name: 'Light Task', duration: 500 },
  { name: 'Medium Task', duration: 1500 },
  { name: 'Heavy Task', duration: 3000 },
  { name: 'I/O Wait', duration: 2000 },
  { name: 'Blocking', duration: 5000 },
]

export default function ConcurrencyLab() {
  const { language, tasks, addTask, updateTask, clearTasks } = useLabStore()
  const [mode, setMode] = useState<ConcurrencyMode>('event-loop')
  const [isRunning, setIsRunning] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [spawningThread, setSpawningThread] = useState<number | null>(null)
  
  const simulationRef = useRef<number>()
  const taskIdRef = useRef(0)
  
  const config = LANGUAGE_CONFIG[language]

  // Set mode based on language
  useEffect(() => {
    switch (language) {
      case 'javascript': setMode('event-loop'); break
      case 'go': setMode('goroutines'); break
      case 'cpp':
      case 'rust': setMode('threads'); break
      default: setMode('event-loop')
    }
  }, [language])

  // Generate unique task ID
  const genTaskId = () => `task-${taskIdRef.current++}`

  // Add a new task
  const scheduleTask = useCallback((preset: typeof TASK_PRESETS[0]) => {
    const modeInfo = MODE_INFO[mode]
    
    // For C++ threads, show spawn animation
    if (mode === 'threads' && tasks.length >= modeInfo.lanes) {
      setSpawningThread(tasks.length)
      setTimeout(() => setSpawningThread(null), 2000)
    }

    const task: Task = {
      id: genTaskId(),
      name: preset.name,
      status: 'queued',
      lane: mode === 'event-loop' ? 0 : Math.floor(Math.random() * modeInfo.lanes),
      duration: preset.duration,
    }
    
    addTask(task)
  }, [mode, tasks.length, addTask])

  // Run simulation
  const runSimulation = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)
    setCurrentTime(0)

    const startTime = Date.now()
    let lastUpdate = startTime

    const simulate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      setCurrentTime(elapsed)

      // Process tasks
      tasks.forEach((task) => {
        if (task.status === 'queued') {
          // Check if we can start this task
          const runningOnLane = tasks.some(
            t => t.lane === task.lane && t.status === 'running'
          )
          
          if (!runningOnLane || mode === 'goroutines') {
            updateTask(task.id, { 
              status: 'running',
              startTime: elapsed 
            })
          }
        } else if (task.status === 'running' && task.startTime !== undefined) {
          // Check if task is complete
          if (elapsed - task.startTime >= task.duration) {
            updateTask(task.id, { status: 'completed' })
          }
          
          // Event loop blocking
          if (mode === 'event-loop' && task.duration > 2000) {
            updateTask(task.id, { status: 'blocked' })
          }
        }
      })

      // Continue simulation
      if (tasks.some(t => t.status !== 'completed')) {
        simulationRef.current = requestAnimationFrame(simulate)
      } else {
        setIsRunning(false)
      }
    }

    simulationRef.current = requestAnimationFrame(simulate)
  }, [isRunning, tasks, mode, updateTask])

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
    clearTasks()
    setCurrentTime(0)
    taskIdRef.current = 0
  }, [stopSimulation, clearTasks])

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-chrome flex items-center gap-3">
              <span className="text-3xl">≡</span>
              THE CONCURRENCY LAB
            </h1>
            <p className="text-silver text-sm mt-1">
              Compare different threading models and see how they handle parallel work
            </p>
          </div>
          <LanguageSelector />
        </div>

        {/* Mode Info */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border border-${config.color}/30 bg-${config.color}/5`}
        >
          <div className="flex items-center gap-4">
            <div className={`text-2xl text-${config.color}`}>
              {mode === 'event-loop' ? '🔄' : mode === 'goroutines' ? '🐹' : '🚛'}
            </div>
            <div className="flex-1">
              <h3 className={`font-code text-sm font-bold text-${config.color}`}>
                {MODE_INFO[mode].title}
              </h3>
              <p className="text-steel text-xs mt-0.5">{MODE_INFO[mode].desc}</p>
            </div>
            <div className="text-right text-[10px] font-code text-steel">
              <div>Lanes: {MODE_INFO[mode].lanes}</div>
              <div>Tasks: {tasks.length}</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Panel */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-void-light rounded-lg border border-metal">
        {/* Task Presets */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-code text-steel uppercase">Add Task:</span>
          {TASK_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => scheduleTask(preset)}
              disabled={isRunning}
              className={`px-3 py-1.5 rounded border font-code text-xs transition-all ${
                preset.duration > 2000
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : preset.duration > 1000
                    ? 'bg-neon-js/10 border-neon-js/30 text-neon-js hover:bg-neon-js/20'
                    : 'bg-neon-go/10 border-neon-go/30 text-neon-go hover:bg-neon-go/20'
              } disabled:opacity-50`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={isRunning ? stopSimulation : runSimulation}
            disabled={tasks.length === 0}
            className={`px-4 py-2 rounded border font-code text-xs uppercase transition-all ${
              isRunning
                ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30'
                : 'bg-neon-go/20 border-neon-go text-neon-go hover:bg-neon-go/30'
            } disabled:opacity-50`}
          >
            {isRunning ? '■ Stop' : '▶ Run'}
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 bg-metal/30 border border-metal rounded text-steel font-code text-xs uppercase hover:bg-metal/50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="flex-1 min-h-0 grid grid-cols-4 gap-4">
        {/* Main visualization */}
        <div className="col-span-3 relative">
          <AnimatePresence mode="wait">
            {mode === 'goroutines' ? (
              <motion.div
                key="particles"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <ParticleSwarm
                  particleCount={Math.max(tasks.length * 50, 100)}
                  lanes={MODE_INFO[mode].lanes}
                  active={isRunning || tasks.length > 0}
                />
              </motion.div>
            ) : (
              <motion.div
                key="lanes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <LaneTrack
                  tasks={tasks}
                  lanes={MODE_INFO[mode].lanes}
                  currentTime={currentTime}
                  mode={mode}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Thread spawn overlay */}
          <ThreadSpawnAnimation
            spawning={spawningThread !== null}
            threadId={spawningThread || 0}
          />
        </div>

        {/* Queue sidebar (for event loop) */}
        {mode === 'event-loop' && (
          <div className="col-span-1">
            <EventQueue tasks={tasks} />
          </div>
        )}

        {/* Stats sidebar (for other modes) */}
        {mode !== 'event-loop' && (
          <div className="col-span-1 space-y-4">
            <div className="bg-void-light rounded-lg border border-metal p-4">
              <h4 className="text-[10px] font-code text-steel uppercase tracking-widest mb-3">
                Statistics
              </h4>
              <div className="space-y-2 text-xs font-code">
                <div className="flex justify-between">
                  <span className="text-steel">Queued:</span>
                  <span className="text-neon-js">{tasks.filter(t => t.status === 'queued').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel">Running:</span>
                  <span className="text-neon-cpp">{tasks.filter(t => t.status === 'running').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel">Completed:</span>
                  <span className="text-neon-go">{tasks.filter(t => t.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel">Blocked:</span>
                  <span className="text-red-400">{tasks.filter(t => t.status === 'blocked').length}</span>
                </div>
              </div>
            </div>

            <div className="bg-void-light rounded-lg border border-metal p-4">
              <h4 className="text-[10px] font-code text-steel uppercase tracking-widest mb-3">
                Model Comparison
              </h4>
              <div className="space-y-2 text-[10px] text-steel">
                <p><span className="text-neon-js">JS:</span> Non-blocking but single lane</p>
                <p><span className="text-neon-go">Go:</span> Lightweight, fast switching</p>
                <p><span className="text-neon-cpp">C++:</span> Heavy, OS managed</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-code text-steel">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-steel/30 border border-steel" />
          Queued
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-neon-cpp/50 border border-neon-cpp" />
          Running
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-neon-go/30 border border-neon-go" />
          Completed
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-red-500/50 border border-red-500" />
          Blocked
        </div>
      </div>
    </div>
  )
}
