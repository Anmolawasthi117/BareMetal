import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MonacoWrapper, { LanguageSelector } from '../../components/editor/MonacoWrapper'
import { useHeuristicParser, LineCost, CostLevel } from '../../hooks/useHeuristicParser'
import { useLabStore, LANGUAGE_CONFIG } from '../../store/useLabStore'

const COST_STYLES: Record<CostLevel, { color: string; bg: string; icon: string }> = {
  cheap: { color: 'text-neon-go', bg: 'bg-neon-go/10', icon: '¢' },
  moderate: { color: 'text-neon-js', bg: 'bg-neon-js/10', icon: '$$' },
  expensive: { color: 'text-neon-rust', bg: 'bg-neon-rust/10', icon: '$$$' },
  dangerous: { color: 'text-red-500', bg: 'bg-red-500/10', icon: '⚠️' },
}

export default function CostLab() {
  const { code, language } = useLabStore()
  const { analyzeCode } = useHeuristicParser()
  const [xrayEnabled, setXrayEnabled] = useState(true)
  const [selectedLine, setSelectedLine] = useState<LineCost | null>(null)

  const config = LANGUAGE_CONFIG[language]

  // Analyze code costs
  const costs = useMemo(() => {
    return analyzeCode(code, language)
  }, [code, language, analyzeCode])

  // Cost summary
  const costSummary = useMemo(() => {
    const summary = { cheap: 0, moderate: 0, expensive: 0, dangerous: 0 }
    costs.forEach(c => summary[c.cost]++)
    return summary
  }, [costs])

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-chrome flex items-center gap-3">
              <span className="text-3xl">$</span>
              THE PERFORMANCE LAB
            </h1>
            <p className="text-silver text-sm mt-1">
              Discover the hidden runtime cost of "simple" code
            </p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            
            {/* X-Ray Toggle */}
            <button
              onClick={() => setXrayEnabled(!xrayEnabled)}
              className={`px-4 py-2 rounded border font-code text-xs uppercase transition-all duration-300 ${
                xrayEnabled
                  ? 'bg-neon-cpp/20 border-neon-cpp text-neon-cpp'
                  : 'bg-metal/30 border-metal text-steel'
              }`}
            >
              <span className="mr-2">{xrayEnabled ? '👁' : '👁‍🗨'}</span>
              X-RAY {xrayEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Cost Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-4 gap-4"
        >
          {(Object.keys(COST_STYLES) as CostLevel[]).map((level) => {
            const style = COST_STYLES[level]
            return (
              <div
                key={level}
                className={`p-3 rounded-lg border border-metal ${style.bg}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-code text-lg ${style.color}`}>{style.icon}</span>
                  <span className={`text-2xl font-bold ${style.color}`}>{costSummary[level]}</span>
                </div>
                <p className="text-[10px] text-steel uppercase tracking-wider">{level}</p>
              </div>
            )
          })}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
        {/* Code Editor with Price Tags */}
        <div className="col-span-2 flex flex-col min-h-0">
          <div className="text-[10px] font-code text-steel uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-${config.color}`} />
            SOURCE CODE
          </div>
          <div className="flex-1 min-h-0 relative">
            <MonacoWrapper height="100%" />
            
            {/* Price Tag Overlays */}
            <AnimatePresence>
              {xrayEnabled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-8 right-4 z-10 space-y-1 max-h-[calc(100%-48px)] overflow-auto"
                >
                  {costs.map((cost, index) => {
                    const style = COST_STYLES[cost.cost]
                    return (
                      <motion.div
                        key={`${cost.line}-${index}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedLine(cost)}
                        className={`px-2 py-1 rounded ${style.bg} border border-${style.color.replace('text-', '')}/30 cursor-pointer hover:scale-105 transition-transform`}
                      >
                        <span className={`font-code text-xs ${style.color}`}>
                          L{cost.line}: {cost.label}
                        </span>
                        {cost.warning && (
                          <span className="ml-1 text-xs">⚠</span>
                        )}
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Cost Details Panel */}
        <div className="flex flex-col min-h-0">
          <div className="text-[10px] font-code text-steel uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-js" />
            COST ANALYSIS
          </div>
          <div className="flex-1 min-h-0 bg-void-light rounded-lg border border-metal p-4 overflow-auto">
            {selectedLine ? (
              <CostDetail cost={selectedLine} onClose={() => setSelectedLine(null)} />
            ) : (
              <CostList costs={costs} onSelect={setSelectedLine} />
            )}
          </div>
        </div>
      </div>

      {/* Language Comparison */}
      <div className="mt-4 p-4 bg-void-light rounded-lg border border-metal">
        <h3 className="text-xs font-code text-steel uppercase tracking-widest mb-3">
          Language Cost Comparison
        </h3>
        <div className="grid grid-cols-5 gap-3 text-center">
          {[
            { lang: 'C++', cost: 'Low', color: 'neon-cpp', desc: 'Zero-cost abstractions' },
            { lang: 'Rust', cost: 'Low', color: 'neon-rust', desc: 'Zero-cost + safety' },
            { lang: 'Go', cost: 'Medium', color: 'neon-go', desc: 'GC + interfaces' },
            { lang: 'JavaScript', cost: 'Variable', color: 'neon-js', desc: 'JIT optimization' },
            { lang: 'Python', cost: 'High', color: 'neon-py', desc: 'Dynamic everything' },
          ].map((item) => (
            <div key={item.lang} className="p-2 rounded border border-metal">
              <div className={`font-code text-sm font-bold text-${item.color}`}>{item.lang}</div>
              <div className="text-steel text-xs">{item.cost}</div>
              <div className="text-[10px] text-steel/60 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Cost list component
function CostList({ 
  costs, 
  onSelect 
}: { 
  costs: LineCost[]
  onSelect: (cost: LineCost) => void 
}) {
  if (costs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <div>
          <div className="text-4xl mb-4 opacity-20">💰</div>
          <p className="text-steel text-sm">No cost analysis available</p>
          <p className="text-steel/50 text-xs mt-1">Write some code to see costs</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {costs.map((cost, index) => {
        const style = COST_STYLES[cost.cost]
        return (
          <motion.div
            key={`${cost.line}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onSelect(cost)}
            className={`p-3 rounded border border-metal hover:border-${style.color.replace('text-', '')} cursor-pointer transition-colors ${style.bg}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-code text-sm font-bold ${style.color}`}>
                Line {cost.line}
              </span>
              <span className={`text-lg ${style.color}`}>{cost.label}</span>
            </div>
            <p className="text-xs text-steel">{cost.tooltip}</p>
          </motion.div>
        )
      })}
    </div>
  )
}

// Detailed cost view
function CostDetail({ 
  cost, 
  onClose 
}: { 
  cost: LineCost
  onClose: () => void 
}) {
  const style = COST_STYLES[cost.cost]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`text-3xl ${style.color}`}>{cost.label}</span>
        <button
          onClick={onClose}
          className="text-steel hover:text-chrome transition-colors"
        >
          ✕
        </button>
      </div>

      <div className={`p-4 rounded-lg ${style.bg} border border-metal mb-4`}>
        <h4 className="font-code text-sm font-bold text-chrome mb-2">Line {cost.line}</h4>
        <p className="text-silver text-sm">{cost.tooltip}</p>
      </div>

      {cost.warning && (
        <div className="p-3 rounded border border-red-500/30 bg-red-500/10 mb-4">
          <div className="flex items-center gap-2 text-red-400 text-sm font-bold mb-1">
            <span>⚠️</span> Warning
          </div>
          <p className="text-red-300 text-xs">{cost.warning}</p>
        </div>
      )}

      <div className="mt-auto">
        <h5 className="text-[10px] font-code text-steel uppercase tracking-widest mb-2">
          Cost Level
        </h5>
        <div className="flex items-center gap-2">
          {(['cheap', 'moderate', 'expensive', 'dangerous'] as CostLevel[]).map((level) => (
            <div
              key={level}
              className={`flex-1 h-2 rounded-full ${
                level === cost.cost
                  ? COST_STYLES[level].bg.replace('/10', '/50')
                  : 'bg-metal/30'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-steel">
          <span>Cheap</span>
          <span>Expensive</span>
        </div>
      </div>
    </motion.div>
  )
}
