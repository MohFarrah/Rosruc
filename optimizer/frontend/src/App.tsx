import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './routes/Dashboard'
import { Execution, Impact, Plan } from './routes/Placeholders'
import { Inbox } from './routes/Inbox'
import { IntentDetail } from './routes/IntentDetail'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="intents/:id" element={<IntentDetail />} />
            <Route path="intents/:id/impact" element={<Impact />} />
            <Route path="intents/:id/plan" element={<Plan />} />
            <Route path="intents/:id/execution" element={<Execution />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
