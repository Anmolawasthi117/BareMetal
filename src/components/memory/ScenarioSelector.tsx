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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-code text-steel uppercase tracking-[0.2em]">
          Scenario Library
        </h3>
        <span className="text-[10px] font-code text-steel/50">
          {scenarios.length} Found
        </span>
      </div>
      <div className="grid gap-3">
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
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group
        ${isSelected 
          ? `border-${color}/50 bg-void shadow-[0_0_20px_rgba(0,0,0,0.3)]` 
          : 'border-metal/30 bg-void-light/30 hover:border-metal hover:bg-void-light/50'
        }
      `}
    >
      {/* Selection Glow */}
      {isSelected && (
        <div className={`absolute inset-0 bg-gradient-to-r from-${color}/10 to-transparent pointer-events-none`} />
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors
          ${isSelected ? `bg-${color}/20 text-chrome` : 'bg-void text-steel group-hover:bg-void-light'}
        `}>
          {scenario.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-display font-bold text-sm tracking-tight ${isSelected ? `text-chrome` : 'text-silver group-hover:text-chrome'}`}>
            {scenario.title}
          </h4>
          <p className="text-[11px] text-steel mt-1 line-clamp-2 leading-relaxed">
            {scenario.description}
          </p>
        </div>
        {isSelected && (
          <motion.div
            layoutId="active-dot"
            className={`w-1.5 h-1.5 rounded-full bg-${color} shadow-[0_0_8px_var(--color-${color})] mt-1.5`}
          />
        )}
      </div>
    </motion.button>
  )
}
