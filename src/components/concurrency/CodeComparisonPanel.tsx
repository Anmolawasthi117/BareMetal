import { motion } from 'framer-motion'
import { LanguageImplementation } from '../../data/concurrencyScenarios'
import { Language, LANGUAGE_CONFIG } from '../../store/useLabStore'

interface CodeComparisonPanelProps {
  implementations: Partial<Record<Language, LanguageImplementation>>
  selectedLanguage: Language
}

export default function CodeComparisonPanel({ 
  implementations, 
  selectedLanguage 
}: CodeComparisonPanelProps) {
  const selectedImpl = implementations[selectedLanguage]
  const config = LANGUAGE_CONFIG[selectedLanguage]

  if (!selectedImpl) {
    return (
      <div className="h-full flex items-center justify-center bg-void-light rounded-lg border border-metal">
        <p className="text-steel text-sm">No code available for {config.name}</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-void-light rounded-lg border border-metal overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-metal bg-${config.color}/5`}>
        <div className="flex items-center gap-3">
          <span className={`text-xl text-${config.color}`}>
            {selectedLanguage === 'javascript' ? '🟨' : 
             selectedLanguage === 'go' ? '🐹' : 
             selectedLanguage === 'cpp' ? '⚙️' : 
             selectedLanguage === 'rust' ? '🦀' : '📝'}
          </span>
          <div>
            <h3 className={`font-code text-xs font-bold text-${config.color}`}>
              {config.name} Implementation
            </h3>
            <p className="text-[10px] text-steel capitalize">{selectedImpl.model.replace('-', ' ')}</p>
          </div>
        </div>
        <div className="text-[10px] font-code text-steel">
          Max Concurrent: {selectedImpl.maxConcurrent === 1000 ? '∞' : selectedImpl.maxConcurrent}
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-2 border-b border-metal/50">
        <p className="text-xs text-silver">{selectedImpl.description}</p>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto p-4">
        <pre className="font-code text-xs leading-relaxed">
          {selectedImpl.code.split('\n').map((line, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="hover:bg-metal/20 px-2 py-0.5 rounded transition-colors"
            >
              <span className="inline-block w-6 text-steel/50 select-none text-right mr-3">
                {idx + 1}
              </span>
              <span className="text-silver">{line || ' '}</span>
            </motion.div>
          ))}
        </pre>
      </div>

      {/* Model badge */}
      <div className="px-4 py-3 border-t border-metal flex items-center gap-2">
        <span className="text-[10px] font-code text-steel">Model:</span>
        <span className={`px-2 py-1 rounded text-xs font-code bg-${config.color}/10 text-${config.color} border border-${config.color}/30`}>
          {selectedImpl.model === 'event-loop' ? '🔄 Event Loop' : 
           selectedImpl.model === 'goroutines' ? '🐹 Goroutines' : 
           selectedImpl.model === 'threads' ? '🚛 OS Threads' : 
           '⚡ Async/Await'}
        </span>
      </div>
    </div>
  )
}
