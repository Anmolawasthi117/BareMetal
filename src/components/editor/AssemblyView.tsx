import { motion } from 'framer-motion'
import { useLabStore, LANGUAGE_CONFIG } from '../../store/useLabStore'

interface AssemblyViewProps {
  output: string
  isLoading: boolean
  highlightedLines?: number[]
}

export default function AssemblyView({ 
  output, 
  isLoading,
  highlightedLines = []
}: AssemblyViewProps) {
  const { language } = useLabStore()
  const config = LANGUAGE_CONFIG[language]
  
  // Determine if showing assembly or bytecode
  const isCompiled = ['cpp', 'go', 'rust'].includes(language)
  const title = isCompiled ? 'ASSEMBLY OUTPUT' : 'BYTECODE (SIMULATED)'
  const subtitle = isCompiled ? 'x86-64 / GCC -O2' : 'Virtual Machine Instructions'

  const lines = output.split('\n')

  return (
    <div className="h-full w-full bg-void rounded-lg overflow-hidden border border-metal flex flex-col">
      {/* Header */}
      <div className="h-8 bg-void-light border-b border-metal flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isLoading ? 360 : 0 }}
            transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: 'linear' }}
            className={`w-3 h-3 border-2 border-${config.color} border-t-transparent rounded-full`}
          />
          <span className={`text-xs font-code text-${config.color}`}>{title}</span>
        </div>
        <span className="text-[10px] font-code text-steel">{subtitle}</span>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-auto p-4 font-code text-sm">
        {isLoading ? (
          <LoadingAnimation />
        ) : output ? (
          <div className="space-y-0">
            {lines.map((line, index) => {
              const isHighlighted = highlightedLines.includes(index + 1)
              const isComment = line.trim().startsWith(';') || line.trim().startsWith('//')
              const isLabel = line.includes(':') && !line.includes(';')
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.01, duration: 0.1 }}
                  className={`py-0.5 px-2 rounded transition-colors ${
                    isHighlighted 
                      ? `bg-${config.color}/20 border-l-2 border-${config.color}` 
                      : 'hover:bg-metal/20'
                  }`}
                >
                  <span className={`
                    ${isComment ? 'text-steel italic' : ''}
                    ${isLabel ? `text-${config.color} font-bold` : ''}
                    ${!isComment && !isLabel ? 'text-chrome' : ''}
                  `}>
                    {line || ' '}
                  </span>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Footer Stats */}
      <div className="h-6 bg-void-light border-t border-metal flex items-center px-3 text-[10px] font-code text-steel shrink-0">
        <span>{lines.filter(l => l.trim()).length} instructions</span>
        <span className="mx-2">•</span>
        <span>{output.length} bytes</span>
      </div>
    </div>
  )
}

function LoadingAnimation() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="font-code text-steel text-sm mb-4"
        >
          COMPILING...
        </motion.div>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
              className="w-2 h-2 bg-neon-cpp rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-center">
      <div>
        <div className="text-4xl mb-4 opacity-20">⌁</div>
        <p className="text-steel text-sm">Write some code to see the output</p>
        <p className="text-steel/50 text-xs mt-1">The translation will appear here</p>
      </div>
    </div>
  )
}
