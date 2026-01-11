import { motion } from 'framer-motion'
import { COMPILER_SCENARIOS, CompilerScenario } from '../../data/compilerScenarios'

interface CompilerScenarioSelectorProps {
  currentScenario: string | null
  onSelectScenario: (id: string) => void
}

export default function CompilerScenarioSelector({ 
  currentScenario, 
  onSelectScenario 
}: CompilerScenarioSelectorProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {COMPILER_SCENARIOS.map((scenario) => (
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
  scenario: CompilerScenario
  isSelected: boolean
  onSelect: () => void 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        flex-shrink-0 min-w-[140px] text-left p-3 rounded-lg border transition-all
        ${isSelected 
          ? 'border-chrome bg-chrome/10' 
          : 'border-metal bg-void-light hover:border-steel'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <h4 className={`font-display font-semibold text-xs ${isSelected ? 'text-chrome' : 'text-silver'}`}>
          {scenario.name}
        </h4>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-1.5 h-1.5 rounded-full bg-chrome"
          />
        )}
      </div>
      <p className="text-[10px] text-steel line-clamp-2">
        {scenario.description}
      </p>
    </motion.button>
  )
}
