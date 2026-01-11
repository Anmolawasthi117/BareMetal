import { motion } from 'framer-motion'
import { MEMORY_SCENARIOS, MemoryScenario } from '../../data/memoryScenarios'
import { Language, LANGUAGE_CONFIG } from '../../store/useLabStore'

interface ScenarioSelectorProps {
  language: Language
  currentScenario: string | null
  onSelectScenario: (id: string) => void
}

export default function ScenarioSelector({ 
  language, 
  currentScenario, 
  onSelectScenario 
}: ScenarioSelectorProps) {
  const scenarios = MEMORY_SCENARIOS
  const config = LANGUAGE_CONFIG[language]

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-8 text-steel">
        <p className="text-sm">No scenarios available for {config.name}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-code text-steel uppercase tracking-widest">
        Select a Scenario
      </h3>
      <div className="grid gap-2">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isSelected={currentScenario === scenario.id}
            color={config.color}
            onSelect={() => onSelectScenario(scenario.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ScenarioCard({ 
  scenario, 
  isSelected, 
  color,
  onSelect 
}: { 
  scenario: MemoryScenario
  isSelected: boolean
  color: string
  onSelect: () => void 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        w-full text-left p-4 rounded-lg border transition-all
        ${isSelected 
          ? `border-${color} bg-${color}/10` 
          : 'border-metal bg-void-light hover:border-steel'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{scenario.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className={`font-display font-semibold text-sm ${isSelected ? `text-${color}` : 'text-chrome'}`}>
            {scenario.title}
          </h4>
          <p className="text-xs text-steel mt-1 line-clamp-2">
            {scenario.description}
          </p>
        </div>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-2 h-2 rounded-full bg-${color}`}
          />
        )}
      </div>
    </motion.button>
  )
}
