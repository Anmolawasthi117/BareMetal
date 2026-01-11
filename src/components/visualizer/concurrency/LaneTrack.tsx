import { motion, AnimatePresence } from 'framer-motion'
import { Task } from '../../store/useLabStore'

interface LaneTrackProps {
  tasks: Task[]
  lanes: number
  currentTime: number
  mode: 'event-loop' | 'goroutines' | 'threads'
}

export default function LaneTrack({ tasks, lanes, currentTime, mode }: LaneTrackProps) {
  const laneHeight = 60
  const timeScale = 50 // pixels per second

  return (
    <div className="h-full w-full bg-void-light rounded-lg border border-metal overflow-hidden">
      {/* Header */}
      <div className="h-8 bg-void border-b border-metal flex items-center px-4">
        <span className="text-[10px] font-code text-steel uppercase tracking-widest">
          {mode === 'event-loop' && 'JavaScript Event Loop — Single Thread'}
          {mode === 'goroutines' && 'Go Goroutines — M:N Scheduling'}
          {mode === 'threads' && 'C++ OS Threads — 1:1 Mapping'}
        </span>
        <span className="ml-auto text-[10px] font-code text-neon-go">
          Time: {(currentTime / 1000).toFixed(2)}s
        </span>
      </div>

      {/* Lanes */}
      <div className="relative overflow-x-auto overflow-y-hidden p-4">
        {/* Time ruler */}
        <div className="h-6 border-b border-metal mb-2 relative">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 h-full border-l border-metal"
              style={{ left: i * timeScale }}
            >
              <span className="text-[8px] font-code text-steel ml-1">
                {i}s
              </span>
            </div>
          ))}
        </div>

        {/* Lane tracks */}
        {[...Array(lanes)].map((_, laneIndex) => (
          <div
            key={laneIndex}
            className="relative border-b border-metal/30"
            style={{ height: laneHeight }}
          >
            {/* Lane label */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-code text-steel w-16">
              {mode === 'event-loop' && 'Main'}
              {mode === 'goroutines' && `CPU ${laneIndex}`}
              {mode === 'threads' && `Thread ${laneIndex}`}
            </div>

            {/* Tasks on this lane */}
            <div className="ml-16 relative h-full">
              <AnimatePresence>
                {tasks
                  .filter(t => t.lane === laneIndex)
                  .map((task) => (
                    <TaskBlock
                      key={task.id}
                      task={task}
                      timeScale={timeScale}
                      mode={mode}
                    />
                  ))}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {/* Current time indicator */}
        <motion.div
          animate={{ x: (currentTime / 1000) * timeScale + 64 }}
          className="absolute top-6 bottom-0 w-0.5 bg-neon-cpp z-10"
          style={{ boxShadow: '0 0 10px var(--color-neon-cpp)' }}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-neon-cpp rounded-full" />
        </motion.div>
      </div>
    </div>
  )
}

// Individual task block
function TaskBlock({ 
  task, 
  timeScale,
  mode
}: { 
  task: Task
  timeScale: number
  mode: 'event-loop' | 'goroutines' | 'threads'
}) {
  const startX = (task.startTime || 0) / 1000 * timeScale
  const width = task.duration / 1000 * timeScale

  const getColor = () => {
    if (task.status === 'blocked') return 'bg-red-500/50 border-red-500'
    if (task.status === 'completed') return 'bg-neon-go/30 border-neon-go'
    if (task.status === 'running') return 'bg-neon-cpp/50 border-neon-cpp'
    return 'bg-steel/30 border-steel'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0 }}
      className={`absolute top-2 bottom-2 rounded border ${getColor()} flex items-center justify-center overflow-hidden`}
      style={{ left: startX, width: Math.max(width, 40) }}
    >
      {/* Running animation */}
      {task.status === 'running' && (
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      )}
      
      {/* Blocked animation */}
      {task.status === 'blocked' && (
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute inset-0 bg-red-500/20"
        />
      )}

      <span className="text-[10px] font-code text-chrome truncate px-2 relative z-10">
        {task.name}
      </span>
    </motion.div>
  )
}

// Queue visualization for event loop
export function EventQueue({ tasks }: { tasks: Task[] }) {
  const queuedTasks = tasks.filter(t => t.status === 'queued')

  return (
    <div className="bg-void-light rounded-lg border border-metal p-4">
      <div className="text-[10px] font-code text-steel uppercase tracking-widest mb-3">
        Task Queue ({queuedTasks.length})
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {queuedTasks.map((task, index) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-2 rounded border border-metal bg-void flex items-center gap-2"
            >
              <span className="text-[10px] font-code text-steel">#{index + 1}</span>
              <span className="text-xs font-code text-chrome">{task.name}</span>
              <span className="ml-auto text-[10px] font-code text-neon-js">
                {task.duration}ms
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {queuedTasks.length === 0 && (
          <div className="text-center text-steel text-xs py-4">Queue empty</div>
        )}
      </div>
    </div>
  )
}
