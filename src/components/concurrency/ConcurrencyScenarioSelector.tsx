import { motion } from 'framer-motion'
import { CONCURRENCY_SCENARIOS, ConcurrencyScenario } from '../../data/concurrencyScenarios'

interface ConcurrencyScenarioSelectorProps {
  currentScenario: string | null
  onSelectScenario: (id: string) => void
}

export default function ConcurrencyScenarioSelector({ 
  currentScenario, 
  onSelectScenario 
}: ConcurrencyScenarioSelectorProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {CONCURRENCY_SCENARIOS.map((scenario) => (
        <ScenarioCard
          key={scenario.id}
          scenario={scenario}
          isSelected={currentScenario === scenario.id}
          onSelect={() => onSelectScenario(scenario.id)}
        />
      ))}
    </div>
  )
}

function ScenarioCard({ 
  scenario, 
  isSelected, 
  onSelect 
}: { 
  scenario: ConcurrencyScenario
  isSelected: boolean
  onSelect: () => void 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        flex-shrink-0 w-[200px] text-left p-4 rounded-lg border transition-all
        ${isSelected 
          ? 'border-neon-go bg-neon-go/10' 
          : 'border-metal bg-void-light hover:border-steel'
        }
      `}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{scenario.icon}</span>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 rounded-full bg-neon-go"
          />
        )}
      </div>
      <h4 className={`font-display font-semibold text-sm ${isSelected ? 'text-neon-go' : 'text-chrome'}`}>
        {scenario.title}
      </h4>
      <p className="text-[10px] text-steel mt-1 line-clamp-2">
        {scenario.description}
      </p>
    </motion.button>
  )
}
