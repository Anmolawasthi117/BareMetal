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
    pointsTo?: string
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
    description: 'How memory is allocated, used, and freed across different languages.',
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
                    explanation: '📦 HEAP: Allocating 400 bytes manually. It is stored on the HEAP.',
                    action: 'allocate-heap',
                    blockId: 'cpp-heap-block',
                    blockSize: 400
                },
                {
                    lineNumber: 3,
                    code: 'int* data = new int[100];',
                    explanation: '📍 STACK: The pointer variable `data` holds the address of the heap memory.',
                    action: 'allocate-stack',
                    blockId: 'cpp-stack-ptr',
                    owner: 'data',
                    pointsTo: 'cpp-heap-block',
                    blockSize: 8
                },
                {
                    lineNumber: 6,
                    code: 'process(data);',
                    explanation: '⚙️ USING: We follow the pointer from the stack to the heap to read/write data.',
                    action: 'scope-enter'
                },
                {
                    lineNumber: 9,
                    code: 'delete[] data;',
                    explanation: '🧹 FREE: Returning the heap memory. Note: the stack pointer `data` still exists but points to garbage!',
                    action: 'free',
                    blockId: 'cpp-heap-block'
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
                    explanation: '📦 HEAP: "hello" is on the heap. STACK: `s1` (the owner) holds its address.',
                    action: 'allocate-heap',
                    blockId: 'rust-heap-block',
                    blockSize: 5
                },
                {
                    lineNumber: 3,
                    code: 'let s1 = String::from("hello");',
                    explanation: '📍 STACK: `s1` is the current owner of the heap memory.',
                    action: 'allocate-stack',
                    blockId: 'rust-stack-s1',
                    owner: 's1',
                    pointsTo: 'rust-heap-block',
                    blockSize: 24
                },
                {
                    lineNumber: 6,
                    code: 'let s2 = s1;',
                    explanation: '🔄 MOVE: Ownership transfers to `s2`. `s1` is now invalid, and `s2` now points to the heap.',
                    action: 'transfer-ownership',
                    blockId: 'rust-stack-s1',
                    owner: 's1',
                    targetOwner: 's2'
                },
                {
                    lineNumber: 9,
                    code: '// s2 dropped here',
                    explanation: '🔥 DROP: `s2` goes out of scope. Rust automatically frees the heap memory. No manual free or GC needed!',
                    action: 'free',
                    blockId: 'rust-heap-block'
                }
            ]
        },
        python: {
            code: `def main():
    # 1. Object Creation
    data = [1, 2, 3]
    
    # 2. Reference (Aliasing)
    alias = data
    
    # 3. Del Reference
    del alias
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'data = [1, 2, 3]',
                    explanation: '📦 HEAP: List created on heap. RefCount = 1.',
                    action: 'allocate-heap',
                    blockId: 'py-heap-obj',
                    blockSize: 64
                },
                {
                    lineNumber: 3,
                    code: 'data = [1, 2, 3]',
                    explanation: '📍 STACK: `data` name assigned to heap object.',
                    action: 'allocate-stack',
                    blockId: 'py-stack-data',
                    owner: 'data',
                    pointsTo: 'py-heap-obj',
                    blockSize: 8
                },
                {
                    lineNumber: 6,
                    code: 'alias = data',
                    explanation: '🔗 REF: `alias` now points to the same object. RefCount = 2.',
                    action: 'allocate-stack',
                    blockId: 'py-stack-alias',
                    owner: 'alias',
                    pointsTo: 'py-heap-obj',
                    blockSize: 8
                },
                {
                    lineNumber: 9,
                    code: 'del alias',
                    explanation: '✂️ DEREF: `alias` removed from stack. RefCount = 1.',
                    action: 'free',
                    blockId: 'py-stack-alias'
                }
            ]
        },
        javascript: {
            code: `function main() {
    // 1. Allocation
    let obj = { id: 1 };
    
    // 2. Unreachable
    obj = null;
    
    // 3. GC Collects later
}`,
            steps: [
                {
                    lineNumber: 2,
                    code: 'let obj = { id: 1 };',
                    explanation: '📦 HEAP: Object created in the V8 nursery.',
                    action: 'allocate-heap',
                    blockId: 'js-block',
                    blockSize: 32
                },
                {
                    lineNumber: 2,
                    code: 'let obj = { id: 1 };',
                    explanation: '📍 STACK: `obj` variable holds the reference.',
                    action: 'allocate-stack',
                    blockId: 'js-stack-ptr',
                    owner: 'obj',
                    pointsTo: 'js-block',
                    blockSize: 8
                },
                {
                    lineNumber: 5,
                    code: 'obj = null;',
                    explanation: '👻 DETACH: Reference cleared. Object is now unreachable (Garbage!).',
                    action: 'free',
                    blockId: 'js-stack-ptr'
                },
                {
                    lineNumber: 8,
                    code: '// GC Cycle',
                    explanation: '🗑️ SWEEP: The Garbage Collector identifies unreachable objects and reclaims them.',
                    action: 'gc-sweep',
                    blockId: 'js-block'
                }
            ]
        },
        go: {
            code: `func main() {
    // 1. Slice (Escape to Heap)
    data := make([]int, 10)
    
    // 2. Use
    process(data)
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'data := make([]int, 10)',
                    explanation: '📦 ESCAPE: Go determines this slice might escape to heap.',
                    action: 'allocate-heap',
                    blockId: 'go-heap-obj',
                    blockSize: 80
                },
                {
                    lineNumber: 3,
                    code: 'data := make([]int, 10)',
                    explanation: '📍 STACK: The slice header is on the stack.',
                    action: 'allocate-stack',
                    blockId: 'go-stack-hdr',
                    owner: 'data',
                    pointsTo: 'go-heap-obj',
                    blockSize: 24
                },
                {
                    lineNumber: 6,
                    code: 'process(data)',
                    explanation: '⚙️ USE: Accessing heap memory through the stack header.',
                    action: 'scope-enter'
                }
            ]
        }
    }
}

// ============================================
// Scenario 2: Safety & Issues
// ============================================

const safetyScenario: MemoryScenario = {
    id: 'safety',
    title: 'Memory Safety',
    description: 'Understanding leaks, dangling pointers, and safety guarantees.',
    icon: '🛡️',
    implementations: {
        cpp: {
            code: `void leakExample() {
    // 1. Allocate
    int* data = new int[50];
    
    // 2. Lose Pointer (Leak!)
    data = nullptr;
}`,
            steps: [
                {
                    lineNumber: 3,
                    code: 'int* data = new int[50];',
                    explanation: '📦 ALLOC: 200 bytes on heap.',
                    action: 'allocate-heap',
                    blockId: 'cpp-leak-heap',
                    blockSize: 200
                },
                {
                    lineNumber: 3,
                    code: 'int* data = new int[50];',
                    explanation: '📍 STACK: `data` points to it.',
                    action: 'allocate-stack',
                    blockId: 'cpp-leak-stack',
                    owner: 'data',
                    pointsTo: 'cpp-leak-heap',
                    blockSize: 8
                },
                {
                    lineNumber: 6,
                    code: 'data = nullptr;',
                    explanation: '💧 LEAK: Pointer is cleared, but memory was never freed! It is lost forever.',
                    action: 'leak',
                    blockId: 'cpp-leak-heap'
                },
                {
                    lineNumber: 6,
                    code: 'data = nullptr;',
                    explanation: '👻 GHOST: Stack variable is now null, pointing nowhere.',
                    action: 'free',
                    blockId: 'cpp-leak-stack'
                }
            ]
        },
        rust: {
            code: `fn safety() {
    let s1 = String::from("safe");
    // Ownership ensures no leaks!
}`,
            steps: [
                {
                    lineNumber: 2,
                    code: 'let s1 = String::from("safe");',
                    explanation: '📦 SAFE: Rust tracks ownership automatically.',
                    action: 'allocate-heap',
                    blockId: 'rust-safe-heap',
                    blockSize: 4
                }
            ]
        },
        python: {
            code: `def safety():
    x = [1, 2, 3]
    # GC handles it`,
            steps: [
                {
                    lineNumber: 2,
                    code: 'x = [1, 2, 3]',
                    explanation: '♻️ GC: Ref count will handle cleanup.',
                    action: 'allocate-heap',
                    blockId: 'py-safe-heap',
                    blockSize: 64
                }
            ]
        },
        javascript: {
            code: `function safety() {
    const obj = {};
    // GC handles it
}`,
            steps: [
                {
                    lineNumber: 2,
                    code: 'const obj = {};',
                    explanation: '♻️ GC: Managed by runtime.',
                    action: 'allocate-heap',
                    blockId: 'js-safe-heap',
                    blockSize: 16
                }
            ]
        },
        go: {
            code: `func safety() {
    data := make([]int, 5)
    // GC handles it
}`,
            steps: [
                {
                    lineNumber: 2,
                    code: 'data := make([]int, 5)',
                    explanation: '♻️ GC: Managed by Go runtime.',
                    action: 'allocate-heap',
                    blockId: 'go-safe-heap',
                    blockSize: 40
                }
            ]
        }
    }
}

export const MEMORY_SCENARIOS: MemoryScenario[] = [
    allocationScenario,
    safetyScenario,
]

export const getScenarioById = (id: string) =>
    MEMORY_SCENARIOS.find(s => s.id === id) || null
