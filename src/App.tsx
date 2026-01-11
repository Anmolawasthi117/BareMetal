import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'))
const CompilerLab = lazy(() => import('./pages/labs/CompilerLab'))
const MemoryLab = lazy(() => import('./pages/labs/MemoryLab'))
const CostLab = lazy(() => import('./pages/labs/CostLab'))
const ConcurrencyLab = lazy(() => import('./pages/labs/ConcurrencyLab'))
const SafetyLab = lazy(() => import('./pages/labs/SafetyLab'))

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-void">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-2 border-neon-cpp rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-2 border-2 border-neon-go rounded-full animate-pulse"></div>
          <div className="absolute inset-4 border-2 border-neon-rust rounded-full animate-spin"></div>
        </div>
        <p className="text-silver font-code text-sm tracking-widest">LOADING SYSTEM...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/labs/compiler" element={<CompilerLab />} />
            <Route path="/labs/memory" element={<MemoryLab />} />
            <Route path="/labs/cost" element={<CostLab />} />
            <Route path="/labs/concurrency" element={<ConcurrencyLab />} />
            <Route path="/labs/safety" element={<SafetyLab />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  )
}

export default App
