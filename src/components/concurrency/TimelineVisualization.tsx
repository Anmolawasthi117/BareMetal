import { motion, AnimatePresence } from 'framer-motion'
import { Task } from '../../store/useLabStore'
import { ConcurrencyModel } from '../../data/concurrencyScenarios'

interface TimelineVisualizationProps {
  tasks: Task[]
  model: ConcurrencyModel
  lanes: number
  currentTime: number
  isRunning: boolean
  totalDuration: number
}

export default function TimelineVisualization({
  tasks,
  model,
  lanes,
  currentTime,
  isRunning,
  totalDuration,
}: TimelineVisualizationProps) {
  const laneHeight = 48
  const timeScale = 600 / Math.max(totalDuration, 5000) // Scale to fit 600px width

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'queued': return 'bg-steel/30 border-steel'
      case 'running': return 'bg-neon-cpp/50 border-neon-cpp'
      case 'completed': return 'bg-neon-go/30 border-neon-go'
      case 'blocked': return 'bg-red-500/50 border-red-500'
      default: return 'bg-metal border-metal'
    }
  }

  const getModelColor = () => {
    switch (model) {
      case 'event-loop': return 'neon-js'
      case 'goroutines': return 'neon-go'
      case 'threads': return 'neon-cpp'
      case 'async-await': return 'neon-rust'
      case 'multiprocessing': return 'neon-py'
      default: return 'neon-cpp'
    }
  }

  const modelColor = getModelColor()

  return (
    <div className="h-full bg-void-light rounded-lg border border-metal overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-metal bg-${modelColor}/5`}>
        <div className="flex items-center gap-3">
          <span className={`text-${modelColor} text-lg`}>
            {model === 'event-loop' ? '🔄' : model === 'goroutines' ? '🐹' : model === 'threads' ? '🚛' : model === 'multiprocessing' ? '🏭' : '⚡'}
          </span>
          <div>
            <h3 className={`font-code text-xs font-bold text-${modelColor} uppercase`}>
              {model === 'event-loop' ? 'Event Loop' : 
               model === 'goroutines' ? 'Goroutines' : 
               model === 'threads' ? 'OS Threads' : 
               model === 'multiprocessing' ? 'Multiprocessing' :
               'Async/Await'}
            </h3>
            <p className="text-[10px] text-steel">
              {lanes} lane{lanes > 1 ? 's' : ''} • {tasks.length} tasks
            </p>
          </div>
        </div>
        <div className="text-[10px] font-code text-steel">
          {(currentTime / 1000).toFixed(1)}s / {(totalDuration / 1000).toFixed(1)}s
        </div>
      </div>

      {/* Timeline Area */}
      <div className="p-4">
        {/* Lane labels */}
        <div className="flex gap-4">
          {/* Lane names column */}
          <div className="w-24 flex-shrink-0">
            {Array.from({ length: lanes }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-[10px] font-code text-steel"
                style={{ height: laneHeight }}
              >
                <span className={`w-2 h-2 rounded-full bg-${modelColor}`} />
                {model === 'event-loop' ? 'Main' : 
                 model === 'goroutines' ? `Goroutine ${i + 1}` : 
                 model === 'multiprocessing' ? `Process ${i + 1}` :
                 `Thread ${i + 1}`}
              </div>
            ))}
          </div>

          {/* Timeline tracks */}
          <div className="flex-1 relative">
            {/* Grid background */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, var(--color-metal) 0px, var(--color-metal) 1px, transparent 1px, transparent 60px)',
              }}
            />

            {/* Lanes */}
            {Array.from({ length: lanes }).map((_, laneIndex) => (
              <div
                key={laneIndex}
                className="relative border-b border-metal/50 last:border-0"
                style={{ height: laneHeight }}
              >
                {/* Tasks on this lane */}
                <AnimatePresence>
                  {tasks
                    .filter(t => t.lane === laneIndex)
                    .map((task) => {
                      const startX = (task.startTime || 0) * timeScale
                      const width = Math.max(task.duration * timeScale, 20)
                      
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            x: startX,
                          }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={`
                            absolute top-2 h-8 rounded border px-2 flex items-center
                            ${getStatusColor(task.status)}
                          `}
                          style={{ width }}
                        >
                          <span className="text-[10px] font-code text-chrome truncate">
                            {task.name}
                          </span>
                          
                          {/* Running animation */}
                          {task.status === 'running' && (
                            <motion.div
                              className="absolute inset-0 rounded bg-neon-cpp/20"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          )}
                          
                          {/* Blocked indicator */}
                          {task.status === 'blocked' && (
                            <span className="ml-auto text-red-400 text-[10px]">⏸</span>
                          )}
                        </motion.div>
                      )
                    })}
                </AnimatePresence>
              </div>
            ))}

            {/* Time cursor */}
            {isRunning && (
              <motion.div
                className={`absolute top-0 bottom-0 w-0.5 bg-${modelColor}`}
                style={{ 
                  left: currentTime * timeScale,
                  boxShadow: `0 0 10px var(--color-${modelColor})` 
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </div>
        </div>

        {/* Time axis */}
        <div className="mt-2 ml-28 flex justify-between text-[10px] font-code text-steel">
          <span>0s</span>
          <span>{(totalDuration / 2000).toFixed(1)}s</span>
          <span>{(totalDuration / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 py-3 border-t border-metal flex items-center gap-6 text-[10px] font-code">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-steel/30 border border-steel" />
          <span className="text-steel">Queued: {tasks.filter(t => t.status === 'queued').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-neon-cpp/50 border border-neon-cpp" />
          <span className="text-neon-cpp">Running: {tasks.filter(t => t.status === 'running').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-neon-go/30 border border-neon-go" />
          <span className="text-neon-go">Done: {tasks.filter(t => t.status === 'completed').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-red-500/50 border border-red-500" />
          <span className="text-red-400">Blocked: {tasks.filter(t => t.status === 'blocked').length}</span>
        </div>
      </div>
    </div>
  )
}
