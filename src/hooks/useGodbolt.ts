import { useState, useEffect, useCallback, useRef } from 'react'
import { useLabStore, Language } from '../store/useLabStore'

interface GodboltResponse {
    asm: Array<{ text: string; source?: { line: number } }>
    code: number
    stderr?: Array<{ text: string }>
}

// Godbolt compiler IDs
const COMPILER_IDS: Partial<Record<Language, string>> = {
    cpp: 'g132', // GCC 13.2
    go: 'gccgo132',
    rust: 'r1750', // Rust 1.75.0
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}

export function useGodbolt() {
    const { code, language, setOutput, setIsLoading, isLoading, output } = useLabStore()
    const [error, setError] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    // Debounce code changes (1000ms as specified)
    const debouncedCode = useDebounce(code, 1000)

    const fetchAssembly = useCallback(async (sourceCode: string, lang: Language) => {
        const compilerId = COMPILER_IDS[lang]

        // Python and JS don't use Godbolt - simulate bytecode
        if (!compilerId) {
            return simulateBytecode(sourceCode, lang)
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(
                `https://godbolt.org/api/compiler/${compilerId}/compile`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    signal: abortControllerRef.current.signal,
                    body: JSON.stringify({
                        source: sourceCode,
                        options: {
                            userArguments: '-O2',
                            filters: {
                                binary: false,
                                commentOnly: true,
                                demangle: true,
                                directives: true,
                                execute: false,
                                intel: true,
                                labels: true,
                                libraryCode: false,
                                trim: true,
                            },
                        },
                    }),
                }
            )

            if (!response.ok) {
                throw new Error(`Compilation failed: ${response.status}`)
            }

            const data: GodboltResponse = await response.json()

            // Format assembly output with line numbers
            const asmText = data.asm
                .map((line, i) => {
                    const lineNum = String(i + 1).padStart(4, ' ')
                    const sourceRef = line.source?.line ? ` ; src:${line.source.line}` : ''
                    return `${lineNum} │ ${line.text}${sourceRef}`
                })
                .join('\n')

            setOutput(asmText || '; No assembly output')

            // Check for errors
            if (data.stderr && data.stderr.length > 0) {
                const errorText = data.stderr.map(e => e.text).join('\n')
                setError(errorText)
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return // Ignore aborted requests
            }
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
            setOutput(`; Error: ${message}`)
        } finally {
            setIsLoading(false)
        }
    }, [setOutput, setIsLoading])

    // Simulate bytecode for interpreted languages
    const simulateBytecode = useCallback((sourceCode: string, lang: Language) => {
        setIsLoading(true)

        // Simulate processing delay
        setTimeout(() => {
            let bytecode: string

            if (lang === 'python') {
                bytecode = generatePythonBytecode(sourceCode)
            } else if (lang === 'javascript') {
                bytecode = generateJSBytecode(sourceCode)
            } else {
                bytecode = '; Bytecode simulation not available for this language'
            }

            setOutput(bytecode)
            setIsLoading(false)
        }, 300)
    }, [setOutput, setIsLoading])

    // Auto-fetch on code change
    useEffect(() => {
        if (debouncedCode.trim()) {
            fetchAssembly(debouncedCode, language)
        }
    }, [debouncedCode, language, fetchAssembly])

    return {
        output,
        isLoading,
        error,
        refetch: () => fetchAssembly(code, language),
    }
}

// Simulated Python bytecode generator
function generatePythonBytecode(code: string): string {
    const lines = code.split('\n')
    const bytecode: string[] = ['# Python Bytecode (Simulated CPython 3.11)', '']

    let offset = 0
    lines.forEach((line, lineNum) => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) return

        // Simple pattern matching for demo
        if (trimmed.includes('def ')) {
            bytecode.push(`${offset.toString().padStart(4)} MAKE_FUNCTION`)
            offset += 2
        } else if (trimmed.includes('print(')) {
            bytecode.push(`${offset.toString().padStart(4)} LOAD_GLOBAL    (print)`)
            offset += 2
            bytecode.push(`${offset.toString().padStart(4)} LOAD_FAST      (arg)`)
            offset += 2
            bytecode.push(`${offset.toString().padStart(4)} CALL           1`)
            offset += 2
        } else if (trimmed.includes('for ')) {
            bytecode.push(`${offset.toString().padStart(4)} GET_ITER`)
            offset += 2
            bytecode.push(`${offset.toString().padStart(4)} FOR_ITER       (loop)`)
            offset += 2
        } else if (trimmed.includes('=') && !trimmed.includes('==')) {
            const varName = trimmed.split('=')[0].trim()
            bytecode.push(`${offset.toString().padStart(4)} STORE_FAST     (${varName})`)
            offset += 2
        } else if (trimmed.includes('return')) {
            bytecode.push(`${offset.toString().padStart(4)} RETURN_VALUE`)
            offset += 2
        } else if (trimmed.includes('[')) {
            bytecode.push(`${offset.toString().padStart(4)} BUILD_LIST`)
            offset += 2
        }
    })

    bytecode.push('')
    bytecode.push(`# ${offset} bytes total`)

    return bytecode.join('\n')
}

// Simulated JavaScript bytecode generator
function generateJSBytecode(code: string): string {
    const lines = code.split('\n')
    const bytecode: string[] = ['// V8 Bytecode (Simulated)', '']

    let offset = 0
    lines.forEach((line) => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('//')) return

        if (trimmed.includes('function') || trimmed.includes('=>')) {
            bytecode.push(`[${offset.toString().padStart(4)}] CreateClosure`)
            offset += 4
        } else if (trimmed.includes('console.log')) {
            bytecode.push(`[${offset.toString().padStart(4)}] LdaGlobal [console]`)
            offset += 4
            bytecode.push(`[${offset.toString().padStart(4)}] GetNamedProperty [log]`)
            offset += 4
            bytecode.push(`[${offset.toString().padStart(4)}] CallProperty1`)
            offset += 4
        } else if (trimmed.includes('const ') || trimmed.includes('let ')) {
            bytecode.push(`[${offset.toString().padStart(4)}] StaCurrentContextSlot`)
            offset += 4
        } else if (trimmed.includes('forEach') || trimmed.includes('map')) {
            bytecode.push(`[${offset.toString().padStart(4)}] GetNamedProperty [${trimmed.includes('forEach') ? 'forEach' : 'map'}]`)
            offset += 4
            bytecode.push(`[${offset.toString().padStart(4)}] CallProperty1`)
            offset += 4
        } else if (trimmed.includes('return')) {
            bytecode.push(`[${offset.toString().padStart(4)}] Return`)
            offset += 4
        }
    })

    bytecode.push('')
    bytecode.push(`// Frame size: ${offset} bytes`)

    return bytecode.join('\n')
}

export default useGodbolt
