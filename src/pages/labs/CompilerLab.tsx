import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import MonacoWrapper, { LanguageSelector } from '../../components/editor/MonacoWrapper'
import AssemblyView from '../../components/editor/AssemblyView'
import CompilerScenarioSelector from '../../components/compiler/CompilerScenarioSelector'
import { useGodbolt } from '../../hooks/useGodbolt'
import { useLabStore, LANGUAGE_CONFIG } from '../../store/useLabStore'
import { COMPILER_SCENARIOS } from '../../data/compilerScenarios'

export default function CompilerLab() {
  const { 
    language,
    currentCompilerScenario,
    setCompilerScenario,
    setCode
  } = useLabStore()
  
  const { output, isLoading, error, sourceToAsmMap } = useGodbolt()
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)

  const config = LANGUAGE_CONFIG[language]
  const isCompiled = ['cpp', 'go', 'rust'].includes(language)

  // Auto-select first scenario
  useEffect(() => {
    if (!currentCompilerScenario && COMPILER_SCENARIOS.length > 0) {
      setCompilerScenario(COMPILER_SCENARIOS[0].id)
    }
  }, [currentCompilerScenario, setCompilerScenario])

  // Update code when scenario/language changes
  useEffect(() => {
    if (!currentCompilerScenario) return
    const scenario = COMPILER_SCENARIOS.find(s => s.id === currentCompilerScenario)
    if (scenario && scenario.code[language]) {
      setCode(scenario.code[language])
    }
  }, [currentCompilerScenario, language, setCode])

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-chrome flex items-center gap-3">
              <span className="text-3xl">⚙</span>
              THE TRANSLATION LAB
            </h1>
            <p className="text-silver text-sm mt-1">
              Watch your code transform into machine instructions
            </p>
          </div>
          <LanguageSelector />
        </div>

        {/* Scenario Selector */}
        <div className="mb-4">
          <CompilerScenarioSelector
            currentScenario={currentCompilerScenario}
            onSelectScenario={setCompilerScenario}
          />
        </div>

        {/* Language Info Banner */}
        <motion.div
          key={language}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border border-${config.color}/30 bg-${config.color}/5`}
        >
          <div className="flex items-center gap-4">
            <div className={`text-2xl text-${config.color}`}>
              {isCompiled ? '🔧' : '📜'}
            </div>
            <div>
              <h3 className={`font-code text-sm font-bold text-${config.color}`}>
                {isCompiled ? 'COMPILED LANGUAGE' : 'INTERPRETED LANGUAGE'}
              </h3>
              <p className="text-steel text-xs mt-0.5">
                {isCompiled 
                  ? `${config.name} compiles directly to machine code via the Godbolt API`
                  : `${config.name} runs on a Virtual Machine — showing simulated bytecode`
                }
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Split Editor View */}
      <div className="flex-1 grid grid-cols-2 gap-4 h-full overflow-hidden">
        {/* Left: Code Editor */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="text-[10px] font-code text-steel uppercase tracking-widest mb-2 flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-neon-py" />
            SOURCE CODE
          </div>
          <div className="flex-1 h-full overflow-hidden">
            <MonacoWrapper 
              height="100%" 
              onLineHover={setHoveredLine}
            />
          </div>
        </div>

        {/* Right: Assembly/Bytecode Output */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="text-[10px] font-code text-steel uppercase tracking-widest mb-2 flex items-center gap-2 shrink-0">
            <span className={`w-2 h-2 rounded-full bg-${config.color}`} />
            {isCompiled ? 'ASSEMBLY' : 'BYTECODE'}
          </div>
          <div className="flex-1 h-full overflow-hidden">
            <AssemblyView 
              output={output} 
              isLoading={isLoading}
              highlightedLines={hoveredLine ? (sourceToAsmMap[hoveredLine] || []) : []}
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-code"
        >
          <span className="font-bold">Error:</span> {error}
        </motion.div>
      )}

      {/* Bottom Legend */}
      <div className="mt-4 flex items-center justify-center gap-8 text-[10px] font-code text-steel">
        <div className="flex items-center gap-2">
          <span className="text-neon-cpp">█</span> C++ / x86-64
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neon-rust">█</span> Rust / x86-64
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neon-go">█</span> Go / x86-64
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neon-py">█</span> Python / CPython Bytecode
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neon-js">█</span> JavaScript / V8 Bytecode
        </div>
      </div>
    </div>
  )
}
