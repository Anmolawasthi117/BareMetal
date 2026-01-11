import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BlockGrid, { LeakIndicator, GCSweeper } from '../../components/visualizer/memory/BlockGrid'
import { LanguageSelector } from '../../components/editor/MonacoWrapper'
import { useLabStore, MemoryBlock, LANGUAGE_CONFIG } from '../../store/useLabStore'

type SimulationMode = 'manual' | 'ownership' | 'refcount' | 'gc'

const MODE_INFO: Record<SimulationMode, { lang: string; title: string; desc: string }> = {
  manual: { lang: 'cpp', title: 'Manual Memory', desc: 'new/delete - You control everything' },
  ownership: { lang: 'rust', title: 'Ownership Model', desc: 'Move semantics - Memory freed when owner dies' },
  refcount: { lang: 'python', title: 'Reference Counting', desc: 'Count references - Free at zero' },
  gc: { lang: 'go', title: 'Garbage Collection', desc: 'Periodic sweeps - Runtime decides' },
}

export default function MemoryLab() {
  const { 
    language, 
    memoryBlocks, 
    addMemoryBlock, 
    removeMemoryBlock, 
    updateMemoryBlock,
    clearMemory,
    isSimulating,
    setIsSimulating
  } = useLabStore()
  
  const [mode, setMode] = useState<SimulationMode>('manual')
  const [gcActive, setGcActive] = useState(false)
  const [hasLeak, setHasLeak] = useState(false)

  const config = LANGUAGE_CONFIG[language]

  // Determine mode based on language
  useEffect(() => {
    switch (language) {
      case 'cpp': setMode('manual'); break
      case 'rust': setMode('ownership'); break
      case 'python': setMode('refcount'); break
      case 'go': 
      case 'javascript': setMode('gc'); break
    }
  }, [language])

  // Generate unique ID
  const genId = () => Math.random().toString(36).substr(2, 9)

  // Allocate memory
  const allocate = useCallback((type: 'heap' | 'stack' = 'heap') => {
    const block: MemoryBlock = {
      id: genId(),
      address: `0x${Math.random().toString(16).substr(2, 8).toUpperCase()}`,
      size: Math.floor(Math.random() * 256) + 16,
      status: 'allocated',
      type,
      refCount: mode === 'refcount' ? 1 : undefined,
      owner: mode === 'ownership' ? 'main' : undefined,
    }
    addMemoryBlock(block)
  }, [mode, addMemoryBlock])

  // Free memory (C++ manual)
  const free = useCallback((id: string) => {
    if (mode === 'manual') {
      removeMemoryBlock(id)
    }
  }, [mode, removeMemoryBlock])

  // Add reference (Python)
  const addRef = useCallback((id: string) => {
    if (mode === 'refcount') {
      const block = memoryBlocks.find(b => b.id === id)
      if (block) {
        updateMemoryBlock(id, { refCount: (block.refCount || 0) + 1 })
      }
    }
  }, [mode, memoryBlocks, updateMemoryBlock])

  // Remove reference (Python)
  const releaseRef = useCallback((id: string) => {
    if (mode === 'refcount') {
      const block = memoryBlocks.find(b => b.id === id)
      if (block && block.refCount !== undefined) {
        const newCount = block.refCount - 1
        if (newCount <= 0) {
          // Animate countdown then remove
          updateMemoryBlock(id, { refCount: 0 })
          setTimeout(() => removeMemoryBlock(id), 500)
        } else {
          updateMemoryBlock(id, { refCount: newCount })
        }
      }
    }
  }, [mode, memoryBlocks, updateMemoryBlock, removeMemoryBlock])

  // Transfer ownership (Rust)
  const transferOwnership = useCallback((id: string, newOwner: string) => {
    if (mode === 'ownership') {
      updateMemoryBlock(id, { owner: newOwner })
    }
  }, [mode, updateMemoryBlock])

  // GC Sweep
  const runGC = useCallback(() => {
    setGcActive(true)
    const garbageBlocks = memoryBlocks.filter(b => b.status === 'garbage')
    
    setTimeout(() => {
      garbageBlocks.forEach(b => {
        updateMemoryBlock(b.id, { status: 'freed' })
      })
      setTimeout(() => {
        garbageBlocks.forEach(b => removeMemoryBlock(b.id))
        setGcActive(false)
      }, 500)
    }, 1000)
  }, [memoryBlocks, updateMemoryBlock, removeMemoryBlock])

  // Mark as garbage (for GC mode)
  const markGarbage = useCallback((id: string) => {
    if (mode === 'gc') {
      updateMemoryBlock(id, { status: 'garbage' })
    }
  }, [mode, updateMemoryBlock])

  // Check for leaks
  useEffect(() => {
    if (mode === 'manual') {
      const leakedBlocks = memoryBlocks.filter(b => b.status === 'allocated' && b.type === 'heap')
      setHasLeak(leakedBlocks.length > 0)
    } else {
      setHasLeak(false)
    }
  }, [memoryBlocks, mode])

  // Simulate scope exit (frees stack, orphans heap in C++)
  const exitScope = useCallback(() => {
    // Free stack
    memoryBlocks
      .filter(b => b.type === 'stack')
      .forEach(b => removeMemoryBlock(b.id))
    
    // In C++, heap becomes leaked
    if (mode === 'manual') {
      memoryBlocks
        .filter(b => b.type === 'heap' && b.status === 'allocated')
        .forEach(b => updateMemoryBlock(b.id, { status: 'leaked' }))
    }
    
    // In Rust, owned heap is freed
    if (mode === 'ownership') {
      memoryBlocks
        .filter(b => b.type === 'heap')
        .forEach(b => removeMemoryBlock(b.id))
    }
  }, [memoryBlocks, mode, removeMemoryBlock, updateMemoryBlock])

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-chrome flex items-center gap-3">
              <span className="text-3xl">▦</span>
              THE MEMORY LAB
            </h1>
            <p className="text-silver text-sm mt-1">
              Visualize how different languages manage memory
            </p>
          </div>
          <LanguageSelector />
        </div>

        {/* Mode Info */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border border-${config.color}/30 bg-${config.color}/5`}
        >
          <div className="flex items-center gap-4">
            <div className={`text-2xl text-${config.color}`}>
              {mode === 'manual' ? '🔓' : mode === 'ownership' ? '🔗' : mode === 'refcount' ? '🔢' : '🗑'}
            </div>
            <div>
              <h3 className={`font-code text-sm font-bold text-${config.color}`}>
                {MODE_INFO[mode].title.toUpperCase()}
              </h3>
              <p className="text-steel text-xs mt-0.5">{MODE_INFO[mode].desc}</p>
            </div>
            {hasLeak && <LeakIndicator />}
          </div>
        </motion.div>
      </div>

      {/* Control Panel */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-void-light rounded-lg border border-metal">
        <button
          onClick={() => allocate('heap')}
          className="px-4 py-2 bg-neon-cpp/20 border border-neon-cpp/50 rounded text-neon-cpp text-xs font-code uppercase hover:bg-neon-cpp/30 transition-colors"
        >
          Allocate Heap
        </button>
        <button
          onClick={() => allocate('stack')}
          className="px-4 py-2 bg-neon-go/20 border border-neon-go/50 rounded text-neon-go text-xs font-code uppercase hover:bg-neon-go/30 transition-colors"
        >
          Allocate Stack
        </button>
        
        {mode === 'gc' && (
          <button
            onClick={runGC}
            disabled={gcActive}
            className="px-4 py-2 bg-neon-py/20 border border-neon-py/50 rounded text-neon-py text-xs font-code uppercase hover:bg-neon-py/30 transition-colors disabled:opacity-50"
          >
            {gcActive ? 'Sweeping...' : 'Run GC'}
          </button>
        )}
        
        <button
          onClick={exitScope}
          className="px-4 py-2 bg-neon-rust/20 border border-neon-rust/50 rounded text-neon-rust text-xs font-code uppercase hover:bg-neon-rust/30 transition-colors"
        >
          Exit Scope
        </button>
        
        <button
          onClick={clearMemory}
          className="ml-auto px-4 py-2 bg-metal/30 border border-metal rounded text-steel text-xs font-code uppercase hover:bg-metal/50 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Memory Visualization */}
      <div className="flex-1 min-h-0 relative">
        <BlockGrid 
          blocks={memoryBlocks} 
          language={language}
          onBlockClick={(block) => {
            if (mode === 'manual') free(block.id)
            if (mode === 'refcount') releaseRef(block.id)
            if (mode === 'gc') markGarbage(block.id)
          }}
        />
        <GCSweeper active={gcActive} />
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-code text-steel">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-neon-cpp bg-neon-cpp/20" />
          Allocated
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-neon-go bg-neon-go/20" />
          Freed
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-red-500 bg-red-500/20" />
          Leaked
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-steel bg-steel/20" />
          Garbage
        </div>
      </div>
    </div>
  )
}
