import { motion } from 'framer-motion'
import { ConcurrencyScenario, ConcurrencyModel } from '../../data/concurrencyScenarios'
import { Language, LANGUAGE_CONFIG } from '../../store/useLabStore'

interface AnalogyPanelProps {
  scenario: ConcurrencyScenario | null
  language: Language
  currentModel: ConcurrencyModel | null
  metrics?: {
    totalTime: number
    efficiency: number
    memoryOverhead: string
  }
}

export default function AnalogyPanel({ 
  scenario, 
  language,
  currentModel,
  metrics 
}: AnalogyPanelProps) {
  const config = LANGUAGE_CONFIG[language]

  if (!scenario) {
    return (
      <div className="p-4 rounded-lg border border-metal bg-void-light">
        <p className="text-steel text-sm text-center">
          Select a scenario to see real-world analogies
        </p>
      </div>
    )
  }

  const analogy = currentModel ? scenario.analogy.comparison[currentModel] : null

  return (
    <motion.div
      key={`${scenario.id}-${currentModel}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border border-${config.color}/30 bg-${config.color}/5`}
    >
      <div className="flex gap-6">
        {/* Analogy Section */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{scenario.analogy.title.split(' ')[0]}</span>
            <div>
              <h4 className={`font-code text-xs font-bold text-${config.color} uppercase`}>
                Real-World Analogy
              </h4>
              <p className="text-[10px] text-steel">{scenario.analogy.description}</p>
            </div>
          </div>
          
          {analogy && (
            <div className="bg-void rounded-lg border border-metal p-3">
              <p className="text-sm text-silver leading-relaxed">
                <span className={`text-${config.color} font-semibold`}>{config.name}: </span>
                {analogy}
              </p>
            </div>
          )}
        </div>

        {/* Metrics Section */}
        {metrics && (
          <div className="w-48 flex-shrink-0">
            <h4 className="text-[10px] font-code text-steel uppercase tracking-widest mb-3">
              Performance
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-steel">Total Time:</span>
                <span className={`font-code text-${config.color}`}>
                  {(metrics.totalTime / 1000).toFixed(2)}s
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-steel">Efficiency:</span>
                <span className={`font-code ${metrics.efficiency > 80 ? 'text-neon-go' : metrics.efficiency > 50 ? 'text-neon-js' : 'text-red-400'}`}>
                  {metrics.efficiency}%
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-steel">Memory:</span>
                <span className="font-code text-silver">{metrics.memoryOverhead}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Model Comparison Pills */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[10px] text-steel font-code">Compare:</span>
        {Object.entries(scenario.analogy.comparison).map(([model, _]) => (
          <span
            key={model}
            className={`
              px-2 py-0.5 rounded text-[10px] font-code
              ${model === currentModel 
                ? `bg-${config.color}/20 text-${config.color} border border-${config.color}/50` 
                : 'bg-metal/30 text-steel'
              }
            `}
          >
            {model === 'event-loop' ? 'JS' : 
             model === 'goroutines' ? 'Go' : 
             model === 'threads' ? 'C++' : 'Rust'}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
