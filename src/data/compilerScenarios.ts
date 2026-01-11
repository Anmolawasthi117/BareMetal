import { Language } from '../store/useLabStore'

export interface CompilerScenario {
    id: string
    name: string
    description: string
    code: Record<Language, string>
}

export const COMPILER_SCENARIOS: CompilerScenario[] = [
    {
        id: 'hello-world',
        name: 'Hello World',
        description: 'The classic entry point. Compare main functions and printing.',
        code: {
            cpp: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
            python: `def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()`,
            javascript: `console.log("Hello, World!");`,
            go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
            rust: `fn main() {
    println!("Hello, World!");
}`
        }
    },
    {
        id: 'loops-logic',
        name: 'Loops & Logic',
        description: 'Iteration and conditionals. implementation differences.',
        code: {
            cpp: `#include <iostream>

int main() {
    for (int i = 0; i < 5; i++) {
        if (i % 2 == 0) {
            std::cout << "Even: " << i << std::endl;
        } else {
            std::cout << "Odd: " << i << std::endl;
        }
    }
    return 0;
}`,
            python: `for i in range(5):
    if i % 2 == 0:
        print(f"Even: {i}")
    else:
        print(f"Odd: {i}")`,
            javascript: `for (let i = 0; i < 5; i++) {
    if (i % 2 === 0) {
        console.log(\`Even: \${i}\`);
    } else {
        console.log(\`Odd: \${i}\`);
    }
}`,
            go: `package main

import "fmt"

func main() {
    for i := 0; i < 5; i++ {
        if i%2 == 0 {
            fmt.Printf("Even: %d\\n", i)
        } else {
            fmt.Printf("Odd: %d\\n", i)
        }
    }
}`,
            rust: `fn main() {
    for i in 0..5 {
        if i % 2 == 0 {
            println!("Even: {}", i);
        } else {
            println!("Odd: {}", i);
        }
    }
}`
        }
    },
    {
        id: 'memory-alloc',
        name: 'Memory Allocation',
        description: 'Stack vs Heap allocation patterns.',
        code: {
            cpp: `#include <iostream>

int main() {
    // Stack allocation
    int stackVar = 10;
    
    // Heap allocation
    int* heapVar = new int(20);
    
    std::cout << stackVar << " " << *heapVar << std::endl;
    
    delete heapVar;
    return 0;
}`,
            python: `class Data:
    def __init__(self, val):
        self.val = val

def main():
    # Primitives are often optimized
    x = 10
    
    # Objects are heap allocated
    obj = Data(20)
    
    print(f"{x} {obj.val}")

main()`,
            javascript: `function main() {
    // Primitives (Stack-like behavior in spec, implementation varies)
    const x = 10;
    
    // Objects (Heap)
    const obj = { val: 20 };
    
    console.log(x, obj.val);
}
main();`,
            go: `package main

import "fmt"

type Data struct {
    val int
}

func main() {
    // Stack (usually)
    x := 10
    
    // Heap (escapes to heap)
    obj := &Data{val: 20}
    
    fmt.Printf("%d %d\\n", x, obj.val)
}`,
            rust: `fn main() {
    // Stack
    let x = 10;
    
    // Heap
    let heap_var = Box::new(20);
    
    println!("{} {}", x, heap_var);
}`
        }
    },
    {
        id: 'recursion',
        name: 'Recursion',
        description: 'Function calls and stack frames.',
        code: {
            cpp: `#include <iostream>

int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

int main() {
    std::cout << fib(10) << std::endl;
    return 0;
}`,
            python: `def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(10))`,
            javascript: `function fib(n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

console.log(fib(10));`,
            go: `package main

import "fmt"

func fib(n int) int {
    if n <= 1 {
        return n
    }
    return fib(n-1) + fib(n-2)
}

func main() {
    fmt.Println(fib(10))
}`,
            rust: `fn fib(n: u32) -> u32 {
    if n <= 1 {
        return n;
    }
    fib(n - 1) + fib(n - 2)
}

fn main() {
    println!("{}", fib(10));
}`
        }
    }
]
