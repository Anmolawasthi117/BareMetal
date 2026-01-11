import { Language } from '../store/useLabStore'

// ============================================
// Memory Scenario Types
// ============================================

export type MemoryActionType =
    | 'allocate-heap'
    | 'allocate-stack'
    | 'free'
    | 'leak'
    | 'transfer-ownership'
    | 'add-reference'
    | 'remove-reference'
    | 'gc-mark'
    | 'gc-sweep'
    | 'scope-enter'
    | 'scope-exit'

export interface MemoryStep {
    lineNumber: number
    code: string
    explanation: string
    action: MemoryActionType
    blockId?: string
    blockSize?: number
    owner?: string
    targetOwner?: string
}

export interface ScenarioImplementation {
    code: string
    steps: MemoryStep[]
}

export interface MemoryScenario {
    id: string
    title: string
    description: string
    icon: string
    implementations: Record<Language, ScenarioImplementation>
}

// ============================================
// Scenario 1: Allocation & Lifecycle
// ============================================

const allocationScenario: MemoryScenario = {
    id: 'allocation',
    title: 'Object Lifecycle',
    description: 'How memory is allocated, used, and freed.',
    icon: '📦',
    implementations: {
        cpp: {
            code: `void processData() {
    // 1. Manual Allocation
    int* data = new int[100];
    
    // 2. Usage
    process(data);
    
    // 3. Manual Deallocation
    delete[] data;
    data = nullptr;
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'int* data = new int[100];',
                    explanation: '📦 HEAP: Allocating 400 bytes manually. We are responsible for this memory.',
                    action: 'allocate-heap',
                    blockId: 'cpp-block',
                    blockSize: 400
                },
                {
                    lineNumber: 6,
                    code: 'process(data);',
                    explanation: '⚙️ USING: The pointer is valid. Reading/Writing allowed.',
                    action: 'scope-enter'
                },
                {
                    lineNumber: 9,
                    code: 'delete[] data;',
                    explanation: '🧹 FREE: Manually returning memory to OS. Critical step!',
                    action: 'free',
                    blockId: 'cpp-block'
                },
                {
                    lineNumber: 10,
                    code: 'data = nullptr;',
                    explanation: '🛡️ NULL: Preventing dangling pointer usage.',
                    action: 'scope-exit'
                }
            ]
        },
        rust: {
            code: `fn main() {
    // 1. RAII Allocation (Owner)
    let s1 = String::from("hello");
    
    // 2. Move (Ownership Transfer)
    let s2 = s1;
    
    // 3. Auto-Drop (Scope End)
    // s2 dropped here
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'let s1 = String::from("hello");',
                    explanation: '📦 OWNER: s1 owns the heap memory. Rust tracks this.',
                    action: 'allocate-heap',
                    blockId: 'rust-block',
                    blockSize: 24,
                    owner: 's1'
                },
                {
                    lineNumber: 6,
                    code: 'let s2 = s1;',
                    explanation: '🔄 MOVE: Ownership transfers to s2. s1 is now invalid (compile-time check).',
                    action: 'transfer-ownership',
                    blockId: 'rust-block',
                    owner: 's1',
                    targetOwner: 's2'
                },
                {
                    lineNumber: 9,
                    code: '// s2 dropped here',
                    explanation: '🔥 DROP: Scope ends. Rust automatically frees s2\'s memory. No leaks.',
                    action: 'free',
                    blockId: 'rust-block'
                }
            ]
        },
        python: {
            code: `def main():
    # 1. Object Creation (Ref Count = 1)
    data = [1, 2, 3]
    
    # 2. Reference (Ref Count = 2)
    alias = data
    
    # 3. Del Reference (Ref Count = 1)
    del alias
    
    # 4. End Scope (Ref Count = 0)
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'data = [1, 2, 3]',
                    explanation: '📦 ALLOC: List created. RefCount = 1 (data).',
                    action: 'allocate-heap',
                    blockId: 'py-block',
                    blockSize: 64
                },
                {
                    lineNumber: 6,
                    code: 'alias = data',
                    explanation: '🔗 REF: New reference. RefCount = 2.',
                    action: 'add-reference',
                    blockId: 'py-block'
                },
                {
                    lineNumber: 9,
                    code: 'del alias',
                    explanation: '✂️ DEREF: Reference removed. RefCount = 1.',
                    action: 'remove-reference',
                    blockId: 'py-block'
                },
                {
                    lineNumber: 11,
                    code: '# 4. End Scope (Ref Count = 0)',
                    explanation: '♻️ GC: Scope ends, data lost. RefCount -> 0. Python frees it.',
                    action: 'free',
                    blockId: 'py-block'
                }
            ]
        },
        javascript: {
            code: `function main() {
    // 1. Allocation
    let obj = { id: 1 };
    
    // 2. Reference
    let ref = obj;
    
    // 3. Unreachable
    obj = null;
    ref = null;
    
    // 4. GC Collects later
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'let obj = { id: 1 };',
                    explanation: '📦 ALLOC: Object created on V8 Heap.',
                    action: 'allocate-heap',
                    blockId: 'js-block',
                    blockSize: 32
                },
                {
                    lineNumber: 6,
                    code: 'let ref = obj;',
                    explanation: '🔗 MARK: Another reference points to this object.',
                    action: 'add-reference' // Visual distinction mostly
                },
                {
                    lineNumber: 9,
                    code: 'obj = null;',
                    explanation: '👻 DETACH: Broken one link. Object still reachable via ref.',
                    action: 'remove-reference'
                },
                {
                    lineNumber: 10,
                    code: 'ref = null;',
                    explanation: '🗑️ GARBAGE: No references left! Marked for sweep.',
                    action: 'gc-mark',
                    blockId: 'js-block'
                }
            ]
        },
        go: {
            code: `func main() {
    // 1. Make (Escape to Heap)
    data := make([]int, 100)
    
    // 2. Use
    process(data)
    
    // 3. Out of Scope / Nil
    data = nil
    
    // 4. GC runs eventually
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'data := make([]int, 100)',
                    explanation: '📦 ALLOC: Slice escapes to heap.',
                    action: 'allocate-heap',
                    blockId: 'go-block',
                    blockSize: 800
                },
                {
                    lineNumber: 6,
                    code: 'process(data)',
                    explanation: '⚙️ RUN: Active usage.',
                    action: 'scope-enter'
                },
                {
                    lineNumber: 9,
                    code: 'data = nil',
                    explanation: '👻 UNREACHABLE: Pointer removed. GC candidate.',
                    action: 'gc-mark',
                    blockId: 'go-block'
                },
                {
                    lineNumber: 11,
                    code: '// 4. GC runs eventually',
                    explanation: '🧹 SWEEP: Go Runtime eventually reclaims this memory.',
                    action: 'gc-sweep',
                    blockId: 'go-block'
                }
            ]
        }
    }
}

// ============================================
// Scenario 2: Safety Checks (Forgot to Free)
// ============================================

const safetyScenario: MemoryScenario = {
    id: 'safety',
    title: 'The "Forgot to Free" Test',
    description: 'What happens if we forget cleanup?',
    icon: '⚠️',
    implementations: {
        cpp: {
            code: `void risky() {
    // Allocating...
    int* ptr = new int(42);
    
    // Doing work...
    // Oops, forgot delete!
    
    // Scope ends
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'int* ptr = new int(42);',
                    explanation: '📦 ALLOC: 4 bytes allocated on heap.',
                    action: 'allocate-heap',
                    blockId: 'leak-block',
                    blockSize: 4
                },
                {
                    lineNumber: 6,
                    code: '// Oops, forgot delete!',
                    explanation: '⚠️ WARNING: No delete keyword found.',
                    action: 'scope-enter'
                },
                {
                    lineNumber: 8,
                    code: '// Scope ends',
                    explanation: '💧 LEAK: stack pointer `ptr` is gone, but heap memory REMAINS used. 4 bytes lost forever (until process exit).',
                    action: 'leak',
                    blockId: 'leak-block'
                }
            ]
        },
        rust: {
            code: `fn safe() {
    // Allocating...
    let b = Box::new(42);
    
    // Doing work...
    // Forgot to free? Impossible!
    
    // Scope ends -> Drop
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'let b = Box::new(42);',
                    explanation: '📦 ALLOC: Box owns the memory.',
                    action: 'allocate-heap',
                    blockId: 'safe-block',
                    blockSize: 4,
                    owner: 'b'
                },
                {
                    lineNumber: 6,
                    code: '// Forgot to free? Impossible!',
                    explanation: '🛡️ SAFETY: Rust enforces cleanup via Drop trait.',
                    action: 'scope-enter'
                },
                {
                    lineNumber: 8,
                    code: '// Scope ends -> Drop',
                    explanation: '✅ CLEANUP: Variable b out of scope. Memory freed automatically.',
                    action: 'free',
                    blockId: 'safe-block'
                }
            ]
        },
        python: {
            code: `def safe():
    # Allocating...
    x = MyObject()
    
    # Forget specific cleanup?
    # Python GC handles it
    
    return
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'x = MyObject()',
                    explanation: '📦 ALLOC: Object created.',
                    action: 'allocate-heap',
                    blockId: 'safe-py',
                    blockSize: 32
                },
                {
                    lineNumber: 6,
                    code: '# Python GC handles it',
                    explanation: '🤖 AUTO: No manual free needed in Python.',
                    action: 'scope-enter'
                },
                {
                    lineNumber: 8,
                    code: 'return',
                    explanation: '✅ GC: Local vars cleared on return. RefCount -> 0. Freed.',
                    action: 'free',
                    blockId: 'safe-py'
                }
            ]
        },
        javascript: {
            code: `function safe() {
    // Allocating...
    let x = { data: 42 };
    
    // Forget cleanup?
    // JS Engine handles it
    
    return;
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'let x = { data: 42 };',
                    explanation: '📦 ALLOC: Object created.',
                    action: 'allocate-heap',
                    blockId: 'safe-js',
                    blockSize: 32
                },
                {
                    lineNumber: 8,
                    code: 'return;',
                    explanation: '✅ GC: Context popped. Object unreachable. GC will collect it.',
                    action: 'gc-mark',
                    blockId: 'safe-js'
                }
            ]
        },
        go: {
            code: `func safe() {
    // Allocating...
    p := new(int)
    *p = 42
    
    // Forget cleanup?
    // Go Runtime handles it
    
    return
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'p := new(int)',
                    explanation: '📦 ALLOC: Int allocated on heap.',
                    action: 'allocate-heap',
                    blockId: 'safe-go',
                    blockSize: 8
                },
                {
                    lineNumber: 10,
                    code: 'return',
                    explanation: '✅ GC: Pointer lost. Memory becomes garbage. Collector will sweep it.',
                    action: 'gc-mark',
                    blockId: 'safe-go'
                }
            ]
        }
    }
}

export const MEMORY_SCENARIOS: MemoryScenario[] = [
    allocationScenario,
    safetyScenario
]

export const getScenarioById = (id: string): MemoryScenario | undefined => {
    return MEMORY_SCENARIOS.find(s => s.id === id)
}
