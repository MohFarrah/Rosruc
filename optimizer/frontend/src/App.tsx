import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OptimizerPanel } from './components/OptimizerPanel'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OptimizerPanel />
    </QueryClientProvider>
  )
}

export default App
