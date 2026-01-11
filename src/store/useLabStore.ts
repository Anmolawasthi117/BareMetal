import { create } from 'zustand'

// Supported languages
export type Language = 'cpp' | 'python' | 'javascript' | 'go' | 'rust'

// Language metadata
export const LANGUAGE_CONFIG: Record<Language, {
    name: string
    extension: string
    color: string
    monacoId: string
}> = {
    cpp: { name: 'C++', extension: 'cpp', color: 'neon-cpp', monacoId: 'cpp' },
    python: { name: 'Python', extension: 'py', color: 'neon-py', monacoId: 'python' },
    javascript: { name: 'JavaScript', extension: 'js', color: 'neon-js', monacoId: 'javascript' },
    go: { name: 'Go', extension: 'go', color: 'neon-go', monacoId: 'go' },
    rust: { name: 'Rust', extension: 'rs', color: 'neon-rust', monacoId: 'rust' },
}

// Default code samples
export const DEFAULT_CODE: Record<Language, string> = {
    cpp: `#include <iostream>

int main() {
    int* ptr = new int(42);
    std::cout << *ptr << std::endl;
    delete ptr;
    return 0;
}`,
    python: `def main():
    x = 42
    y = [1, 2, 3]
    
    for i in y:
        print(i * x)

if __name__ == "__main__":
    main()`,
    javascript: `function main() {
    const arr = [1, 2, 3];
    
    arr.forEach(x => {
        console.log(x * 2);
    });
}

main();`,
    go: `package main

import "fmt"

func main() {
    ch := make(chan int)
    
    go func() {
        ch <- 42
    }()
    
    fmt.Println(<-ch)
}`,
    rust: `fn main() {
    let mut data = vec![1, 2, 3];
    
    for item in &data {
        println!("{}", item);
    }
    
    data.push(4);
}`,
}

// Memory block state
export interface MemoryBlock {
    id: string
    address: string
    size: number
    owner?: string
    refCount?: number
    status: 'allocated' | 'freed' | 'leaked' | 'garbage'
    type: 'heap' | 'stack'
}

// Concurrency state
export interface Task {
    id: string
    name: string
    status: 'queued' | 'running' | 'blocked' | 'completed'
    lane: number
    duration: number
    startTime?: number
}

// Store state
interface LabState {
    // Current language
    language: Language
    setLanguage: (lang: Language) => void

    // Code editor state
    code: string
    setCode: (code: string) => void

    // Assembly/bytecode output
    output: string
    setOutput: (output: string) => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void

    // Memory simulation
    memoryBlocks: MemoryBlock[]
    addMemoryBlock: (block: MemoryBlock) => void
    removeMemoryBlock: (id: string) => void
    updateMemoryBlock: (id: string, updates: Partial<MemoryBlock>) => void
    clearMemory: () => void

    // Concurrency simulation
    tasks: Task[]
    addTask: (task: Task) => void
    updateTask: (id: string, updates: Partial<Task>) => void
    clearTasks: () => void

    // X-Ray mode
    xrayEnabled: boolean
    toggleXray: () => void

    // Simulation controls
    isSimulating: boolean
    setIsSimulating: (simulating: boolean) => void
    simulationSpeed: number
    setSimulationSpeed: (speed: number) => void

    // Memory Lab Scenarios
    currentMemoryScenario: string | null
    currentMemoryStep: number
    setMemoryScenario: (id: string | null) => void
    setMemoryStep: (step: number) => void
    nextMemoryStep: () => void
    prevMemoryStep: () => void
    resetMemoryScenario: () => void

    // Concurrency Lab Scenarios
    currentConcurrencyScenario: string | null
    setConcurrencyScenario: (id: string | null) => void

    // Compiler Lab Scenarios
    currentCompilerScenario: string | null
    setCompilerScenario: (id: string | null) => void
}

export const useLabStore = create<LabState>((set) => ({
    // Language
    language: 'cpp',
    setLanguage: (language) => set({ language, code: DEFAULT_CODE[language] }),

    // Code
    code: DEFAULT_CODE.cpp,
    setCode: (code) => set({ code }),

    // Output
    output: '',
    setOutput: (output) => set({ output }),
    isLoading: false,
    setIsLoading: (isLoading) => set({ isLoading }),

    // Memory
    memoryBlocks: [],
    addMemoryBlock: (block) => set((state) => ({
        memoryBlocks: [...state.memoryBlocks, block]
    })),
    removeMemoryBlock: (id) => set((state) => ({
        memoryBlocks: state.memoryBlocks.filter(b => b.id !== id)
    })),
    updateMemoryBlock: (id, updates) => set((state) => ({
        memoryBlocks: state.memoryBlocks.map(b =>
            b.id === id ? { ...b, ...updates } : b
        )
    })),
    clearMemory: () => set({ memoryBlocks: [] }),

    // Concurrency
    tasks: [],
    addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
    updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    })),
    clearTasks: () => set({ tasks: [] }),

    // X-Ray
    xrayEnabled: false,
    toggleXray: () => set((state) => ({ xrayEnabled: !state.xrayEnabled })),

    // Simulation
    isSimulating: false,
    setIsSimulating: (isSimulating) => set({ isSimulating }),
    simulationSpeed: 1,
    setSimulationSpeed: (simulationSpeed) => set({ simulationSpeed }),

    // Memory Lab Scenarios
    currentMemoryScenario: null,
    currentMemoryStep: 0,
    setMemoryScenario: (id) => set({ currentMemoryScenario: id, currentMemoryStep: 0, memoryBlocks: [] }),
    setMemoryStep: (step) => set({ currentMemoryStep: step }),
    nextMemoryStep: () => set((state) => ({ currentMemoryStep: state.currentMemoryStep + 1 })),
    prevMemoryStep: () => set((state) => ({
        currentMemoryStep: Math.max(0, state.currentMemoryStep - 1)
    })),
    resetMemoryScenario: () => set({ currentMemoryStep: 0, memoryBlocks: [] }),

    // Concurrency Lab Scenarios
    currentConcurrencyScenario: null,
    setConcurrencyScenario: (id) => set({ currentConcurrencyScenario: id, tasks: [] }),

    // Compiler Lab Scenarios
    currentCompilerScenario: null,
    setCompilerScenario: (id) => set({ currentCompilerScenario: id }),
}))
