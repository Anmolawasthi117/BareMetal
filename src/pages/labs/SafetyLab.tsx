import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LanguageSelector } from '../../components/editor/MonacoWrapper'
import { useLabStore, LANGUAGE_CONFIG, Language } from '../../store/useLabStore'

type CrashType = 'segfault' | 'null-pointer' | 'out-of-bounds' | 'use-after-free' | 'overflow'

interface CrashPreset {
  id: CrashType
  name: string
  code: Record<Language, string>
  description: string
}

const CRASH_PRESETS: CrashPreset[] = [
  {
    id: 'segfault',
    name: 'Segmentation Fault',
    description: 'Accessing invalid memory address',
    code: {
      cpp: `int* ptr = nullptr;
*ptr = 42; // CRASH!`,
      rust: `// Rust prevents this at compile time
let ptr: *const i32 = std::ptr::null();
unsafe { *ptr }; // Won't compile safely`,
      go: `var ptr *int = nil
*ptr = 42 // panic: nil pointer`,
      python: `# Python doesn't have raw pointers
# but you can access None attributes
obj = None
obj.method()  # AttributeError`,
      javascript: `let obj = null;
obj.property; // TypeError`,
    },
  },
  {
    id: 'out-of-bounds',
    name: 'Index Out of Bounds',
    description: 'Accessing array beyond its size',
    code: {
      cpp: `int arr[3] = {1, 2, 3};
int val = arr[10]; // Undefined behavior`,
      rust: `let arr = [1, 2, 3];
let val = arr[10]; // panic: index out of bounds`,
      go: `arr := [3]int{1, 2, 3}
val := arr[10] // panic: runtime error`,
      python: `arr = [1, 2, 3]
val = arr[10]  # IndexError`,
      javascript: `const arr = [1, 2, 3];
const val = arr[10]; // undefined (no crash!)`,
    },
  },
  {
    id: 'use-after-free',
    name: 'Use After Free',
    description: 'Accessing freed memory',
    code: {
      cpp: `int* ptr = new int(42);
delete ptr;
*ptr = 100; // UNDEFINED BEHAVIOR!`,
      rust: `// Rust's borrow checker prevents this
let ptr = Box::new(42);
drop(ptr);
// *ptr; // Won't compile!`,
      go: `// Go's GC prevents use-after-free
// You can't manually free memory`,
      python: `# Python's GC prevents this
# Objects are cleaned up automatically`,
      javascript: `// JavaScript's GC handles this
// No manual memory management`,
    },
  },
  {
    id: 'overflow',
    name: 'Stack Overflow',
    description: 'Infinite recursion exhausting stack',
    code: {
      cpp: `void recurse() {
    recurse(); // Stack exhausted
}`,
      rust: `fn recurse() {
    recurse(); // Stack overflow
}`,
      go: `func recurse() {
    recurse() // goroutine stack overflow
}`,
      python: `def recurse():
    recurse()  # RecursionError`,
      javascript: `function recurse() {
    recurse(); // RangeError: Maximum call stack
}`,
    },
  },
]

type Outcome = 'crash' | 'shield' | 'panic' | 'error' | null

const LANGUAGE_OUTCOMES: Record<Language, Record<CrashType, Outcome>> = {
  cpp: {
    'segfault': 'crash',
    'null-pointer': 'crash',
    'out-of-bounds': 'crash',
    'use-after-free': 'crash',
    'overflow': 'crash',
  },
  rust: {
    'segfault': 'shield',
    'null-pointer': 'shield',
    'out-of-bounds': 'panic',
    'use-after-free': 'shield',
    'overflow': 'panic',
  },
  go: {
    'segfault': 'panic',
    'null-pointer': 'panic',
    'out-of-bounds': 'panic',
    'use-after-free': null, // GC handles
    'overflow': 'panic',
  },
  python: {
    'segfault': 'error',
    'null-pointer': 'error',
    'out-of-bounds': 'error',
    'use-after-free': null,
    'overflow': 'error',
  },
  javascript: {
    'segfault': 'error',
    'null-pointer': 'error',
    'out-of-bounds': null, // undefined, no crash
    'use-after-free': null,
    'overflow': 'error',
  },
}

export default function SafetyLab() {
  const { language } = useLabStore()
  const [selectedCrash, setSelectedCrash] = useState<CrashType | null>(null)
  const [showEffect, setShowEffect] = useState<Outcome>(null)
  
  const config = LANGUAGE_CONFIG[language]

  const executeCrash = useCallback((crashType: CrashType) => {
    setSelectedCrash(crashType)
    const outcome = LANGUAGE_OUTCOMES[language][crashType]
    
    // Trigger visual effect
    setTimeout(() => {
      setShowEffect(outcome)
      // Reset after animation
      setTimeout(() => setShowEffect(null), 3000)
    }, 500)
  }, [language])

  const getOutcomeDisplay = (outcome: Outcome) => {
    switch (outcome) {
      case 'crash': return { icon: '💥', text: 'SEGMENTATION FAULT', color: 'red-500' }
      case 'shield': return { icon: '🛡️', text: 'COMPILE ERROR - PROTECTED', color: 'neon-rust' }
      case 'panic': return { icon: '🚨', text: 'PANIC - CONTROLLED CRASH', color: 'neon-go' }
      case 'error': return { icon: '⚠️', text: 'RUNTIME EXCEPTION', color: 'neon-js' }
      default: return { icon: '✅', text: 'SAFE - NO CRASH', color: 'neon-py' }
    }
  }

  return (
    <div className="h-full flex flex-col p-6 relative overflow-hidden">
      {/* Crash Effects */}
      <CrashEffects effect={showEffect} />

      {/* Header */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-chrome flex items-center gap-3">
              <span className="text-3xl">⚠</span>
              THE SAFETY LAB
            </h1>
            <p className="text-silver text-sm mt-1">
              Explore what happens when things go wrong
            </p>
          </div>
          <LanguageSelector />
        </div>

        {/* Warning Banner */}
        <div className="p-4 rounded-lg border border-neon-js/30 bg-neon-js/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔬</span>
            <div>
              <h3 className="font-code text-sm font-bold text-neon-js">SIMULATION MODE</h3>
              <p className="text-steel text-xs mt-0.5">
                These crashes are simulated — your browser is safe!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-3 gap-6 min-h-0 relative z-10">
        {/* Crash Presets */}
        <div className="col-span-1 flex flex-col min-h-0">
          <div className="text-[10px] font-code text-steel uppercase tracking-widest mb-3">
            Select "Bad Code"
          </div>
          <div className="flex-1 overflow-auto space-y-2">
            {CRASH_PRESETS.map((preset) => {
              const outcome = LANGUAGE_OUTCOMES[language][preset.id]
              const display = getOutcomeDisplay(outcome)
              
              return (
                <motion.button
                  key={preset.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => executeCrash(preset.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedCrash === preset.id
                      ? `border-${config.color} bg-${config.color}/10`
                      : 'border-metal hover:border-steel bg-void-light'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{display.icon}</span>
                    <span className="font-code text-sm text-chrome">{preset.name}</span>
                  </div>
                  <p className="text-xs text-steel">{preset.description}</p>
                  <div className={`mt-2 text-[10px] font-code text-${display.color}`}>
                    → {display.text}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Code Display */}
        <div className="col-span-2 flex flex-col min-h-0">
          <div className="text-[10px] font-code text-steel uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-${config.color}`} />
            {config.name} Code Example
          </div>
          
          <div className="flex-1 bg-void-light rounded-lg border border-metal p-4 overflow-auto">
            {selectedCrash ? (
              <CodeDisplay 
                code={CRASH_PRESETS.find(p => p.id === selectedCrash)!.code[language]}
                language={language}
                outcome={LANGUAGE_OUTCOMES[language][selectedCrash]}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-steel text-sm">
                Select a crash scenario to see the code
              </div>
            )}
          </div>

          {/* Language Comparison */}
          {selectedCrash && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-void-light rounded-lg border border-metal"
            >
              <h4 className="text-[10px] font-code text-steel uppercase tracking-widest mb-3">
                How Each Language Handles This
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(LANGUAGE_CONFIG) as Language[]).map((lang) => {
                  const outcome = LANGUAGE_OUTCOMES[lang][selectedCrash]
                  const display = getOutcomeDisplay(outcome)
                  const langConfig = LANGUAGE_CONFIG[lang]
                  
                  return (
                    <div 
                      key={lang}
                      className={`p-2 rounded border text-center ${
                        lang === language 
                          ? `border-${langConfig.color} bg-${langConfig.color}/10`
                          : 'border-metal'
                      }`}
                    >
                      <span className="text-lg">{display.icon}</span>
                      <div className={`text-[10px] font-code text-${langConfig.color}`}>
                        {langConfig.name}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

// Code display component
function CodeDisplay({ 
  code, 
  language, 
  outcome 
}: { 
  code: string
  language: string
  outcome: Outcome 
}) {
  const config = LANGUAGE_CONFIG[language as Language]
  const display = outcome 
    ? { icon: outcome === 'crash' ? '💥' : outcome === 'shield' ? '🛡️' : outcome === 'panic' ? '🚨' : '⚠️' }
    : { icon: '✅' }

  return (
    <div>
      <pre className="font-code text-sm text-chrome whitespace-pre-wrap mb-4">
        {code}
      </pre>
      <div className={`p-3 rounded border ${
        outcome === 'crash' ? 'border-red-500 bg-red-500/10' :
        outcome === 'shield' ? 'border-neon-rust bg-neon-rust/10' :
        outcome === 'panic' ? 'border-neon-go bg-neon-go/10' :
        outcome === 'error' ? 'border-neon-js bg-neon-js/10' :
        'border-neon-py bg-neon-py/10'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{display.icon}</span>
          <span className={`font-code text-sm ${
            outcome === 'crash' ? 'text-red-400' :
            outcome === 'shield' ? 'text-neon-rust' :
            outcome === 'panic' ? 'text-neon-go' :
            outcome === 'error' ? 'text-neon-js' :
            'text-neon-py'
          }`}>
            {outcome === 'crash' && 'UNDEFINED BEHAVIOR - Program may crash'}
            {outcome === 'shield' && 'COMPILE-TIME PROTECTION - Won\'t even compile'}
            {outcome === 'panic' && 'CONTROLLED PANIC - Clean stack trace'}
            {outcome === 'error' && 'RUNTIME EXCEPTION - Catchable error'}
            {!outcome && 'SAFE - Language prevents this issue'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Crash visual effects
function CrashEffects({ effect }: { effect: Outcome }) {
  return (
    <AnimatePresence>
      {/* Screen crack for segfault */}
      {effect === 'crash' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 pointer-events-none"
        >
          {/* Crack lines */}
          <svg className="absolute inset-0 w-full h-full">
            <motion.path
              d="M 50% 0 L 45% 30% L 55% 50% L 40% 80% L 50% 100%"
              stroke="#ff0000"
              strokeWidth="3"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          
          {/* Red flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-red-500"
          />
          
          {/* Glitch effect */}
          <motion.div
            animate={{ 
              x: [0, -5, 5, -3, 3, 0],
              opacity: [1, 0.8, 1, 0.9, 1]
            }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-transparent"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 0, 0, 0.1) 2px, rgba(255, 0, 0, 0.1) 4px)'
            }}
          />
        </motion.div>
      )}

      {/* Shield slam for Rust */}
      {effect === 'shield' && (
        <motion.div
          initial={{ scale: 3, opacity: 0 }}
          animate={{ scale: 1, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="text-9xl">🛡️</div>
        </motion.div>
      )}

      {/* Panic whistle for Go */}
      {effect === 'panic' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.3, repeat: 3 }}
            className="text-9xl"
          >
            🚨
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1 }}
            className="absolute h-1 bg-neon-go top-1/2"
            style={{ boxShadow: '0 0 20px var(--color-neon-go)' }}
          />
        </motion.div>
      )}

      {/* Error popup for Python/JS */}
      {effect === 'error' && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-void-light border border-neon-js rounded-lg p-6 shadow-2xl"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <div className="text-neon-js font-code font-bold">Exception Caught!</div>
            <div className="text-steel text-sm mt-1">The error was handled gracefully</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
