import { useMemo, useCallback } from 'react'
import { Language } from '../store/useLabStore'

// Cost levels for different operations
export type CostLevel = 'cheap' | 'moderate' | 'expensive' | 'dangerous'

export interface LineCost {
    line: number
    cost: CostLevel
    label: string // e.g., "¢", "$$", "$$$"
    tooltip: string
    warning?: string
}

// Pattern matchers for different languages
interface CostPattern {
    pattern: RegExp
    cost: CostLevel
    label: string
    tooltip: string
    warning?: string
}

const COST_PATTERNS: Record<Language, CostPattern[]> = {
    cpp: [
        // Cheap operations
        { pattern: /^\s*int\s+\w+\s*=/, cost: 'cheap', label: '¢', tooltip: 'Stack allocation - single instruction' },
        { pattern: /\*\w+\s*=/, cost: 'cheap', label: '¢', tooltip: 'Pointer dereference - single instruction' },
        { pattern: /^\s*return/, cost: 'cheap', label: '¢', tooltip: 'Return - register move' },

        // Moderate operations
        { pattern: /std::cout/, cost: 'moderate', label: '$$', tooltip: 'I/O operation - system call overhead' },
        { pattern: /std::vector/, cost: 'moderate', label: '$$', tooltip: 'Dynamic array - heap allocation' },
        { pattern: /std::string/, cost: 'moderate', label: '$$', tooltip: 'String - heap allocation + copying' },

        // Expensive operations
        { pattern: /new\s+/, cost: 'expensive', label: '$$$', tooltip: 'Heap allocation - malloc overhead' },
        { pattern: /virtual/, cost: 'expensive', label: '$$$', tooltip: 'Virtual call - vtable lookup' },
        { pattern: /dynamic_cast/, cost: 'expensive', label: '$$$', tooltip: 'Runtime type check - RTTI overhead' },

        // Dangerous
        { pattern: /delete\s+/, cost: 'dangerous', label: '⚠️', tooltip: 'Manual memory free', warning: 'Ensure matching new/delete' },
    ],

    python: [
        // Everything is expensive in Python!
        { pattern: /^\s*\w+\s*=\s*\d+/, cost: 'expensive', label: '$$$', tooltip: 'Integer - boxed object allocation' },
        { pattern: /^\s*\w+\s*=\s*\[/, cost: 'expensive', label: '$$$', tooltip: 'List - dynamic array + boxing' },
        { pattern: /^\s*for\s+/, cost: 'expensive', label: '$$$', tooltip: 'For loop - iterator protocol overhead' },
        { pattern: /^\s*def\s+/, cost: 'moderate', label: '$$', tooltip: 'Function definition - bytecode object' },
        { pattern: /print\(/, cost: 'moderate', label: '$$', tooltip: 'Print - I/O + string formatting' },
        { pattern: /\.\w+\(/, cost: 'expensive', label: '$$$', tooltip: 'Method call - dynamic dispatch' },
        { pattern: /import\s+/, cost: 'expensive', label: '$$$', tooltip: 'Import - module loading + parsing' },
    ],

    javascript: [
        // Type-dependent costs
        { pattern: /const\s+\w+\s*=\s*\d+/, cost: 'cheap', label: '¢', tooltip: 'Number - Smi optimization possible' },
        { pattern: /const\s+\w+\s*=\s*\[/, cost: 'moderate', label: '$$', tooltip: 'Array - elements kind matters' },
        { pattern: /\.push\(/, cost: 'moderate', label: '$$', tooltip: 'Array push - may trigger resize', warning: 'Mixing types causes deoptimization' },
        { pattern: /async\s+/, cost: 'expensive', label: '$$$', tooltip: 'Async function - promise machinery' },
        { pattern: /await\s+/, cost: 'expensive', label: '$$$', tooltip: 'Await - microtask queue + suspension' },
        { pattern: /new\s+Object/, cost: 'expensive', label: '$$$', tooltip: 'Object creation - hidden class' },
        { pattern: /JSON\.parse/, cost: 'expensive', label: '$$$', tooltip: 'JSON parsing - string traversal' },
        { pattern: /eval\(/, cost: 'dangerous', label: '💀', tooltip: 'Eval - kills all optimizations', warning: 'AVOID: Disables JIT optimization' },
    ],

    go: [
        { pattern: /^\s*\w+\s*:=\s*\d+/, cost: 'cheap', label: '¢', tooltip: 'Integer - stack allocation' },
        { pattern: /make\(chan/, cost: 'moderate', label: '$$', tooltip: 'Channel - runtime allocation' },
        { pattern: /go\s+func/, cost: 'moderate', label: '$$', tooltip: 'Goroutine - 2KB stack allocation' },
        { pattern: /<-/, cost: 'moderate', label: '$$', tooltip: 'Channel operation - runtime scheduling' },
        { pattern: /fmt\.Print/, cost: 'moderate', label: '$$', tooltip: 'Print - reflection + I/O' },
        { pattern: /interface\{\}/, cost: 'expensive', label: '$$$', tooltip: 'Empty interface - boxing + type assertion' },
        { pattern: /reflect\./, cost: 'expensive', label: '$$$', tooltip: 'Reflection - runtime introspection' },
    ],

    rust: [
        { pattern: /let\s+\w+\s*=\s*\d+/, cost: 'cheap', label: '¢', tooltip: 'Integer - zero-cost abstraction' },
        { pattern: /let\s+mut/, cost: 'cheap', label: '¢', tooltip: 'Mutable binding - compile-time check' },
        { pattern: /Vec::new/, cost: 'moderate', label: '$$', tooltip: 'Vector - heap allocation' },
        { pattern: /\.clone\(\)/, cost: 'expensive', label: '$$$', tooltip: 'Clone - deep copy', warning: 'Consider borrowing instead' },
        { pattern: /Box::new/, cost: 'moderate', label: '$$', tooltip: 'Box - heap allocation' },
        { pattern: /Arc::new/, cost: 'expensive', label: '$$$', tooltip: 'Arc - atomic reference counting' },
        { pattern: /Mutex::new/, cost: 'expensive', label: '$$$', tooltip: 'Mutex - OS synchronization primitive' },
        { pattern: /\.unwrap\(\)/, cost: 'cheap', label: '¢', tooltip: 'Unwrap - panic path', warning: 'Consider using ? operator' },
    ],
}

export function useHeuristicParser() {
    const analyzeCode = useCallback((code: string, language: Language): LineCost[] => {
        const lines = code.split('\n')
        const costs: LineCost[] = []
        const patterns = COST_PATTERNS[language] || []

        lines.forEach((line, index) => {
            // Skip empty lines and comments
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
                return
            }

            // Check each pattern
            for (const pattern of patterns) {
                if (pattern.pattern.test(line)) {
                    costs.push({
                        line: index + 1, // 1-indexed
                        cost: pattern.cost,
                        label: pattern.label,
                        tooltip: pattern.tooltip,
                        warning: pattern.warning,
                    })
                    break // Only one cost per line
                }
            }
        })

        return costs
    }, [])

    // Memory allocation detection
    const detectAllocations = useCallback((code: string, language: Language) => {
        const allocations: Array<{ line: number; type: 'heap' | 'stack'; variable: string }> = []
        const lines = code.split('\n')

        const patterns: Record<Language, { heap: RegExp; stack: RegExp }> = {
            cpp: {
                heap: /new\s+(\w+)|malloc\s*\(/,
                stack: /^\s*(\w+)\s+(\w+)\s*[=;]/,
            },
            python: {
                heap: /=\s*\[|=\s*\{|=\s*\(/,
                stack: /^\s*(\w+)\s*=\s*\d+/,
            },
            javascript: {
                heap: /new\s+\w+|=\s*\[|=\s*\{/,
                stack: /const\s+(\w+)\s*=\s*\d+/,
            },
            go: {
                heap: /make\s*\(|new\s*\(/,
                stack: /^\s*(\w+)\s*:=/,
            },
            rust: {
                heap: /Box::new|Vec::new|String::new/,
                stack: /let\s+(?:mut\s+)?(\w+)\s*=/,
            },
        }

        const langPatterns = patterns[language]
        if (!langPatterns) return allocations

        lines.forEach((line, index) => {
            if (langPatterns.heap.test(line)) {
                const match = line.match(/(\w+)\s*=/)
                allocations.push({
                    line: index + 1,
                    type: 'heap',
                    variable: match?.[1] || 'anonymous',
                })
            } else if (langPatterns.stack.test(line)) {
                const match = line.match(/(\w+)\s*[=:]/)
                allocations.push({
                    line: index + 1,
                    type: 'stack',
                    variable: match?.[1] || 'local',
                })
            }
        })

        return allocations
    }, [])

    // Ownership transfer detection (for Rust)
    const detectOwnershipTransfers = useCallback((code: string) => {
        const transfers: Array<{ line: number; from: string; to: string }> = []
        const lines = code.split('\n')

        lines.forEach((line, index) => {
            // Simple ownership transfer: let y = x
            const moveMatch = line.match(/let\s+(\w+)\s*=\s*(\w+)\s*;/)
            if (moveMatch) {
                transfers.push({
                    line: index + 1,
                    from: moveMatch[2],
                    to: moveMatch[1],
                })
            }

            // Function call: foo(x)
            const fnMatch = line.match(/(\w+)\s*\(\s*(\w+)\s*\)/)
            if (fnMatch && !line.includes('&')) {
                transfers.push({
                    line: index + 1,
                    from: fnMatch[2],
                    to: `fn:${fnMatch[1]}`,
                })
            }
        })

        return transfers
    }, [])

    return {
        analyzeCode,
        detectAllocations,
        detectOwnershipTransfers,
    }
}

export default useHeuristicParser
