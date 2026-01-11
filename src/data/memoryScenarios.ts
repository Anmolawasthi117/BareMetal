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

export interface MemoryScenario {
    id: string
    title: string
    language: Language
    description: string
    icon: string
    codeTemplate: string
    steps: MemoryStep[]
}

// ============================================
// C++ Scenarios
// ============================================

const cppMemoryLeak: MemoryScenario = {
    id: 'cpp-memory-leak',
    title: 'Memory Leak Demo',
    language: 'cpp',
    description: 'See what happens when you forget to call delete',
    icon: '💧',
    codeTemplate: `void processData() {
    int* data = new int[100];  // Allocate on heap
    
    // ... do some work ...
    
    if (error) {
        return;  // Oops! Forgot to free
    }
    
    delete[] data;  // Never reached!
}

// Scope ends - data is leaked`,
    steps: [
        {
            lineNumber: 2,
            code: 'int* data = new int[100];',
            explanation: '📦 Allocating 400 bytes on the HEAP. The pointer `data` lives on the stack, but the actual array is on the heap.',
            action: 'allocate-heap',
            blockId: 'data-block',
            blockSize: 400,
        },
        {
            lineNumber: 4,
            code: '// ... do some work ...',
            explanation: '⚙️ The program is using the allocated memory. Everything is fine so far.',
            action: 'scope-enter',
        },
        {
            lineNumber: 7,
            code: 'return;  // Oops! Forgot to free',
            explanation: '⚠️ ERROR PATH: Function returns early without freeing memory! The pointer is destroyed but the heap memory remains.',
            action: 'leak',
            blockId: 'data-block',
        },
        {
            lineNumber: 13,
            code: '// Scope ends - data is leaked',
            explanation: '💧 MEMORY LEAK! The 400 bytes are now orphaned - no pointer references them, but they\'re still allocated until the program ends.',
            action: 'scope-exit',
        },
    ],
}

const cppProperCleanup: MemoryScenario = {
    id: 'cpp-proper-cleanup',
    title: 'Proper Memory Cleanup',
    language: 'cpp',
    description: 'The correct way to manage heap memory in C++',
    icon: '✅',
    codeTemplate: `void processData() {
    int* data = new int[100];  // Allocate
    
    // ... do some work ...
    
    delete[] data;  // Always free!
    data = nullptr;  // Prevent dangling
}

// Clean exit - no leaks!`,
    steps: [
        {
            lineNumber: 2,
            code: 'int* data = new int[100];',
            explanation: '📦 Allocating 400 bytes on the heap. We MUST remember to free this later.',
            action: 'allocate-heap',
            blockId: 'data-block',
            blockSize: 400,
        },
        {
            lineNumber: 4,
            code: '// ... do some work ...',
            explanation: '⚙️ Using the allocated memory for processing.',
            action: 'scope-enter',
        },
        {
            lineNumber: 6,
            code: 'delete[] data;',
            explanation: '🧹 Freeing the heap memory! The 400 bytes are returned to the system.',
            action: 'free',
            blockId: 'data-block',
        },
        {
            lineNumber: 7,
            code: 'data = nullptr;',
            explanation: '🛡️ Setting pointer to nullptr prevents accidental use of freed memory (dangling pointer).',
            action: 'scope-exit',
        },
    ],
}

// ============================================
// Rust Scenarios
// ============================================

const rustOwnershipTransfer: MemoryScenario = {
    id: 'rust-ownership',
    title: 'Ownership Transfer',
    language: 'rust',
    description: 'Watch ownership move between variables',
    icon: '🔗',
    codeTemplate: `fn main() {
    let s1 = String::from("hello");  // s1 owns the data
    
    let s2 = s1;  // Ownership MOVES to s2
    
    // println!("{}", s1);  // ERROR! s1 no longer valid
    
    println!("{}", s2);  // s2 is the owner now
}

// s2 goes out of scope - memory freed`,
    steps: [
        {
            lineNumber: 2,
            code: 'let s1 = String::from("hello");',
            explanation: '📦 Creating a String on the heap. Variable `s1` OWNS this memory.',
            action: 'allocate-heap',
            blockId: 'string-block',
            blockSize: 5,
            owner: 's1',
        },
        {
            lineNumber: 4,
            code: 'let s2 = s1;',
            explanation: '🔄 Ownership TRANSFERS from s1 to s2. This is a MOVE, not a copy. s1 is now invalid!',
            action: 'transfer-ownership',
            blockId: 'string-block',
            owner: 's1',
            targetOwner: 's2',
        },
        {
            lineNumber: 6,
            code: '// println!("{}", s1);  // ERROR!',
            explanation: '🚫 Rust compiler prevents using s1 - it\'s been moved! This catches use-after-move bugs at compile time.',
            action: 'scope-enter',
        },
        {
            lineNumber: 8,
            code: 'println!("{}", s2);',
            explanation: '✅ s2 is the valid owner. We can use the data through s2.',
            action: 'scope-enter',
        },
        {
            lineNumber: 11,
            code: '// s2 goes out of scope - memory freed',
            explanation: '🗑️ When s2 goes out of scope, Rust automatically frees the memory. No leaks, no manual cleanup!',
            action: 'free',
            blockId: 'string-block',
        },
    ],
}

// ============================================
// Python Scenarios
// ============================================

const pythonRefCounting: MemoryScenario = {
    id: 'python-refcount',
    title: 'Reference Counting',
    language: 'python',
    description: 'See how Python tracks object references',
    icon: '🔢',
    codeTemplate: `def demo():
    data = [1, 2, 3]  # refcount = 1
    
    alias = data  # refcount = 2
    
    copy = data  # refcount = 3
    
    del alias  # refcount = 2
    
    del copy  # refcount = 1
    
    return data  # passed to caller

# refcount = 0 when caller done`,
    steps: [
        {
            lineNumber: 2,
            code: 'data = [1, 2, 3]',
            explanation: '📦 Creating a list object. Reference count starts at 1 (data references it).',
            action: 'allocate-heap',
            blockId: 'list-block',
            blockSize: 24,
        },
        {
            lineNumber: 4,
            code: 'alias = data',
            explanation: '➕ Creating another reference to the SAME object. Refcount → 2. No new memory allocated!',
            action: 'add-reference',
            blockId: 'list-block',
        },
        {
            lineNumber: 6,
            code: 'copy = data',
            explanation: '➕ Another reference! Refcount → 3. All three variables point to the same list.',
            action: 'add-reference',
            blockId: 'list-block',
        },
        {
            lineNumber: 8,
            code: 'del alias',
            explanation: '➖ Deleting reference. Refcount → 2. Object still alive because other refs exist.',
            action: 'remove-reference',
            blockId: 'list-block',
        },
        {
            lineNumber: 10,
            code: 'del copy',
            explanation: '➖ Another reference gone. Refcount → 1. Only `data` references it now.',
            action: 'remove-reference',
            blockId: 'list-block',
        },
        {
            lineNumber: 14,
            code: '# refcount = 0 when caller done',
            explanation: '🗑️ When refcount hits 0, Python automatically frees the memory. No manual cleanup needed!',
            action: 'free',
            blockId: 'list-block',
        },
    ],
}

// ============================================
// Go/JavaScript GC Scenarios
// ============================================

const goGarbageCollection: MemoryScenario = {
    id: 'go-gc',
    title: 'Garbage Collection',
    language: 'go',
    description: 'Watch the GC sweep unreachable memory',
    icon: '🗑️',
    codeTemplate: `func process() {
    data := make([]int, 1000)  // Allocate
    
    result := compute(data)
    
    data = nil  // No longer needed
    
    // GC will eventually clean up
    
    return result
}

// GC runs periodically`,
    steps: [
        {
            lineNumber: 2,
            code: 'data := make([]int, 1000)',
            explanation: '📦 Allocating a slice on the heap. Go\'s runtime tracks this allocation.',
            action: 'allocate-heap',
            blockId: 'slice-block',
            blockSize: 8000,
        },
        {
            lineNumber: 4,
            code: 'result := compute(data)',
            explanation: '⚙️ Using the data. The slice is still reachable via `data` variable.',
            action: 'scope-enter',
        },
        {
            lineNumber: 6,
            code: 'data = nil',
            explanation: '👻 Setting to nil. The slice is now UNREACHABLE - it\'s garbage!',
            action: 'gc-mark',
            blockId: 'slice-block',
        },
        {
            lineNumber: 8,
            code: '// GC will eventually clean up',
            explanation: '⏳ The memory isn\'t freed immediately. The GC runs periodically in the background.',
            action: 'scope-enter',
        },
        {
            lineNumber: 12,
            code: '// GC runs periodically',
            explanation: '🧹 GC SWEEP! The garbage collector identifies and frees all unreachable memory.',
            action: 'gc-sweep',
            blockId: 'slice-block',
        },
    ],
}

// ============================================
// Export All Scenarios
// ============================================

export const MEMORY_SCENARIOS: MemoryScenario[] = [
    cppMemoryLeak,
    cppProperCleanup,
    rustOwnershipTransfer,
    pythonRefCounting,
    goGarbageCollection,
]

export const getScenariosByLanguage = (lang: Language): MemoryScenario[] => {
    return MEMORY_SCENARIOS.filter(s => s.language === lang)
}

export const getScenarioById = (id: string): MemoryScenario | undefined => {
    return MEMORY_SCENARIOS.find(s => s.id === id)
}
