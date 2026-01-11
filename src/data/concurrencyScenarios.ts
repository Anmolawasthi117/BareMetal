import { Language } from '../store/useLabStore'

// ============================================
// Concurrency Scenario Types
// ============================================

export type ConcurrencyModel = 'event-loop' | 'goroutines' | 'threads' | 'async-await'

export interface TaskDefinition {
    id: string
    name: string
    duration: number
    type: 'cpu' | 'io' | 'network'
    blocksEventLoop?: boolean
}

export interface LanguageImplementation {
    code: string
    model: ConcurrencyModel
    maxConcurrent: number
    description: string
}

export interface ConcurrencyScenario {
    id: string
    title: string
    description: string
    icon: string
    analogy: {
        title: string
        description: string
        comparison: {
            [key in ConcurrencyModel]?: string
        }
    }
    tasks: TaskDefinition[]
    languages: Partial<Record<Language, LanguageImplementation>>
}

// ============================================
// Analogies
// ============================================

const RESTAURANT_ANALOGY = {
    title: '🍽️ Restaurant Kitchen',
    description: 'Think of handling requests like running a restaurant kitchen...',
    comparison: {
        'event-loop': '1 chef who starts cooking, then waits for oven timers while prepping other dishes. Fast for I/O, blocks on heavy cooking.',
        'goroutines': 'Many efficient line cooks sharing a few stoves. They coordinate seamlessly and switch tasks instantly.',
        'threads': 'Dedicated chef per table. Expensive to hire, but each works independently with their own equipment.',
        'async-await': 'Chef with numbered tickets - starts each order, hands off to assistants, picks up when ready.',
    },
}

// ============================================
// Web Server Scenario
// ============================================

const webServerScenario: ConcurrencyScenario = {
    id: 'web-server',
    title: 'Web Server: 100 Requests',
    description: 'Handle 100 HTTP requests - see how different models scale',
    icon: '🌐',
    analogy: RESTAURANT_ANALOGY,
    tasks: [
        { id: 'req-1', name: 'GET /api/users', duration: 200, type: 'network' },
        { id: 'req-2', name: 'GET /api/posts', duration: 150, type: 'network' },
        { id: 'req-3', name: 'POST /api/data', duration: 300, type: 'io' },
        { id: 'req-4', name: 'GET /api/heavy', duration: 2000, type: 'cpu', blocksEventLoop: true },
        { id: 'req-5', name: 'GET /api/users/1', duration: 100, type: 'network' },
        { id: 'req-6', name: 'PUT /api/users/1', duration: 250, type: 'io' },
        { id: 'req-7', name: 'DELETE /api/posts/5', duration: 150, type: 'io' },
        { id: 'req-8', name: 'GET /api/compute', duration: 1500, type: 'cpu', blocksEventLoop: true },
    ],
    languages: {
        javascript: {
            model: 'event-loop',
            maxConcurrent: 1,
            description: 'Single-threaded event loop - great for I/O, blocks on CPU',
            code: `const http = require('http');

http.createServer(async (req, res) => {
  // Non-blocking I/O
  const data = await fetchFromDatabase();
  
  // ⚠️ CPU-heavy work blocks everything!
  const result = heavyComputation(data);
  
  res.end(JSON.stringify(result));
}).listen(3000);

// All requests share ONE thread`,
        },
        go: {
            model: 'goroutines',
            maxConcurrent: 1000,
            description: 'Lightweight goroutines - handles thousands concurrently',
            code: `package main

func handler(w http.ResponseWriter, r *http.Request) {
    // Each request runs in a goroutine
    data := fetchFromDatabase()  // Non-blocking
    
    // CPU work doesn't block other goroutines
    result := heavyComputation(data)
    
    json.NewEncoder(w).Encode(result)
}

// go handler() spawns instantly
// Runtime multiplexes onto OS threads`,
        },
        cpp: {
            model: 'threads',
            maxConcurrent: 8,
            description: 'OS threads - powerful but expensive to spawn',
            code: `void handleRequest(Socket& client) {
    // Each request gets its own thread
    auto data = fetchFromDatabase();
    
    // CPU work is parallel
    auto result = heavyComputation(data);
    
    client.send(result);
}

int main() {
    // Thread pool to manage overhead
    ThreadPool pool(8);
    
    while (true) {
        auto client = server.accept();
        pool.submit([&]{ handleRequest(client); });
    }
}`,
        },
        rust: {
            model: 'async-await',
            maxConcurrent: 1000,
            description: 'Async/await with Tokio - efficient like Go, safe like Rust',
            code: `async fn handle(req: Request) -> Response {
    // Async I/O - no thread blocked
    let data = fetch_from_database().await;
    
    // CPU work can use spawn_blocking
    let result = tokio::task::spawn_blocking(move || {
        heavy_computation(data)
    }).await;
    
    Response::json(result)
}

// Tokio runtime handles scheduling`,
        },
    },
}

// ============================================
// File Processing Scenario
// ============================================

const fileProcessingScenario: ConcurrencyScenario = {
    id: 'file-processing',
    title: 'Process 50 Files',
    description: 'Read and process 50 large files concurrently',
    icon: '📁',
    analogy: {
        title: '📚 Library Research',
        description: 'Imagine researching 50 books at a library...',
        comparison: {
            'event-loop': 'One researcher who requests books, reads while waiting for more, but can only read one at a time.',
            'goroutines': 'Team of researchers who split up, share tables, and help each other. Very efficient!',
            'threads': 'Hiring 50 research assistants - they work in parallel but coordination is complex.',
            'async-await': 'Researcher with a smart queue - requests all books upfront, processes as they arrive.',
        },
    },
    tasks: [
        { id: 'file-1', name: 'Read config.json', duration: 100, type: 'io' },
        { id: 'file-2', name: 'Read data.csv', duration: 500, type: 'io' },
        { id: 'file-3', name: 'Parse large.xml', duration: 1500, type: 'cpu', blocksEventLoop: true },
        { id: 'file-4', name: 'Read log.txt', duration: 200, type: 'io' },
        { id: 'file-5', name: 'Compress output.zip', duration: 2000, type: 'cpu', blocksEventLoop: true },
        { id: 'file-6', name: 'Write results.json', duration: 300, type: 'io' },
    ],
    languages: {
        javascript: {
            model: 'event-loop',
            maxConcurrent: 1,
            description: 'Promise.all for parallel I/O, but CPU work serializes',
            code: `const fs = require('fs').promises;

async function processFiles(files) {
  // Parallel I/O - great!
  const contents = await Promise.all(
    files.map(f => fs.readFile(f))
  );
  
  // ⚠️ CPU processing is sequential
  return contents.map(c => parseAndTransform(c));
}`,
        },
        go: {
            model: 'goroutines',
            maxConcurrent: 50,
            description: 'Goroutine per file with channel coordination',
            code: `func processFiles(files []string) []Result {
    results := make(chan Result, len(files))
    
    for _, file := range files {
        go func(f string) {
            data, _ := ioutil.ReadFile(f)
            results <- parseAndTransform(data)
        }(file)
    }
    
    // Collect all results
    var output []Result
    for range files {
        output = append(output, <-results)
    }
    return output
}`,
        },
        cpp: {
            model: 'threads',
            maxConcurrent: 8,
            description: 'Thread pool with future-based results',
            code: `std::vector<Result> processFiles(
    const std::vector<std::string>& files
) {
    std::vector<std::future<Result>> futures;
    
    for (const auto& file : files) {
        futures.push_back(std::async(
            std::launch::async,
            [&file] {
                auto data = readFile(file);
                return parseAndTransform(data);
            }
        ));
    }
    
    std::vector<Result> results;
    for (auto& f : futures) {
        results.push_back(f.get());
    }
    return results;
}`,
        },
    },
}

// ============================================
// API Aggregator Scenario
// ============================================

const apiAggregatorScenario: ConcurrencyScenario = {
    id: 'api-aggregator',
    title: 'API Aggregator: 5 Services',
    description: 'Fetch data from 5 different APIs and combine results',
    icon: '🔗',
    analogy: {
        title: '📰 News Aggregator',
        description: 'Like gathering news from multiple sources...',
        comparison: {
            'event-loop': 'Read one newspaper, wait, read another. Or request all, read as they arrive.',
            'goroutines': 'Send interns to all newsstands at once. They return with papers as ready.',
            'threads': 'Hire dedicated driver per newsstand. Expensive but truly parallel.',
            'async-await': 'Call all newsstands, they callback when ready. You process arrivals.',
        },
    },
    tasks: [
        { id: 'api-users', name: 'GET /users-service', duration: 300, type: 'network' },
        { id: 'api-posts', name: 'GET /posts-service', duration: 250, type: 'network' },
        { id: 'api-comments', name: 'GET /comments-service', duration: 400, type: 'network' },
        { id: 'api-analytics', name: 'GET /analytics-service', duration: 600, type: 'network' },
        { id: 'api-recommendations', name: 'GET /ml-service', duration: 1000, type: 'network' },
    ],
    languages: {
        javascript: {
            model: 'event-loop',
            maxConcurrent: 5,
            description: 'Promise.all - perfect for parallel network requests',
            code: `async function aggregateData() {
  // All requests start simultaneously!
  const [users, posts, comments, analytics, recs] = 
    await Promise.all([
      fetch('/users-service').then(r => r.json()),
      fetch('/posts-service').then(r => r.json()),
      fetch('/comments-service').then(r => r.json()),
      fetch('/analytics-service').then(r => r.json()),
      fetch('/ml-service').then(r => r.json()),
    ]);
  
  return { users, posts, comments, analytics, recs };
}

// Total time ≈ slowest request (1000ms)
// Not sum of all (2550ms) - that's the power!`,
        },
        go: {
            model: 'goroutines',
            maxConcurrent: 5,
            description: 'Goroutines with WaitGroup for synchronization',
            code: `func aggregateData() Result {
    var wg sync.WaitGroup
    var mu sync.Mutex
    results := make(map[string]interface{})
    
    services := []string{
        "users", "posts", "comments",
        "analytics", "recommendations",
    }
    
    for _, svc := range services {
        wg.Add(1)
        go func(s string) {
            defer wg.Done()
            data := fetchService(s)
            mu.Lock()
            results[s] = data
            mu.Unlock()
        }(svc)
    }
    
    wg.Wait()
    return results
}`,
        },
        rust: {
            model: 'async-await',
            maxConcurrent: 5,
            description: 'tokio::join! for concurrent async operations',
            code: `async fn aggregate_data() -> Result<AggregatedData> {
    // All futures start concurrently
    let (users, posts, comments, analytics, recs) = 
        tokio::join!(
            fetch_service("users"),
            fetch_service("posts"),
            fetch_service("comments"),
            fetch_service("analytics"),
            fetch_service("recommendations"),
        );
    
    Ok(AggregatedData {
        users: users?,
        posts: posts?,
        comments: comments?,
        analytics: analytics?,
        recommendations: recs?,
    })
}`,
        },
    },
}

// ============================================
// Export All Scenarios
// ============================================

export const CONCURRENCY_SCENARIOS: ConcurrencyScenario[] = [
    webServerScenario,
    fileProcessingScenario,
    apiAggregatorScenario,
]

export const getScenarioById = (id: string): ConcurrencyScenario | undefined => {
    return CONCURRENCY_SCENARIOS.find(s => s.id === id)
}

export const getModelForLanguage = (
    scenario: ConcurrencyScenario,
    lang: Language
): LanguageImplementation | undefined => {
    return scenario.languages[lang]
}
