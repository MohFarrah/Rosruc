import type {
  ComputePower,
  OptimizationInterval,
  OptimizationPreferences,
  OptimizationStrategy,
  SavingsComparison,
  SubmitPreferencesResponse,
} from '../types/contracts'
import { api } from './client'
import { isVsCodeWebview, postToExtension } from '../lib/vscode'

export const OPTIMIZATION_STRATEGIES: { value: OptimizationStrategy; label: string; description: string }[] = [
  {
    value: 'layer_cache',
    label: 'Layer cache reuse',
    description: 'Reuse unchanged Docker layers across builds.',
  },
  {
    value: 'multi_stage_slim',
    label: 'Multi-stage slim build',
    description: 'Trim build stages and shrink final image size.',
  },
  {
    value: 'parallel_buildkit',
    label: 'Parallel BuildKit',
    description: 'Parallelize Dockerfile steps with BuildKit.',
  },
]

export const OPTIMIZATION_INTERVALS: { value: OptimizationInterval; label: string }[] = [
  { value: '30m', label: 'Every 30 minutes' },
  { value: '45m', label: 'Every 45 minutes' },
  { value: '1h', label: 'Every 1 hour' },
  { value: '2h', label: 'Every 2 hours' },
  { value: 'manual', label: 'Manual' },
]

/** System-chosen defaults when Auto mode is enabled. */
export const RECOMMENDED_STRATEGY: OptimizationStrategy = 'layer_cache'
export const RECOMMENDED_INTERVAL: OptimizationInterval = '1h'

export const COMPUTE_POWER_OPTIONS: { value: ComputePower; label: string; description: string }[] = [
  {
    value: 'cpu',
    label: 'CPU',
    description: 'Optimize using processor cores — works on every machine.',
  },
  {
    value: 'gpu',
    label: 'GPU',
    description: 'Optimize using GPU acceleration when available.',
  },
]

const DEMO_SAVINGS: SavingsComparison = {
  baseline_minutes: 42,
  optimized_minutes: 18,
  minutes_saved: 24,
  hours_saved: 47.3,
  dollars_saved: 189.12,
}

function submitViaExtension(preferences: OptimizationPreferences): Promise<SubmitPreferencesResponse> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      resolve({
        ok: true,
        message: 'Preferences sent to extension host.',
        savings: DEMO_SAVINGS,
      })
    }, 600)

    const handler = (event: MessageEvent) => {
      if (event.data?.type !== 'submitResult') return
      window.clearTimeout(timeout)
      window.removeEventListener('message', handler)
      resolve(event.data.payload as SubmitPreferencesResponse)
    }

    window.addEventListener('message', handler)
    postToExtension({ type: 'submitPreferences', payload: preferences })
  })
}

export const optimizerApi = {
  submitPreferences: async (preferences: OptimizationPreferences): Promise<SubmitPreferencesResponse> => {
    if (isVsCodeWebview) {
      return submitViaExtension(preferences)
    }

    try {
      return await api.post<SubmitPreferencesResponse>('/optimize/preferences', preferences)
    } catch {
      return {
        ok: true,
        message: 'Backend endpoint not available yet — using demo savings.',
        savings: DEMO_SAVINGS,
      }
    }
  },

  getSavingsComparison: async (): Promise<SavingsComparison> => {
    if (isVsCodeWebview) {
      postToExtension({ type: 'getSavings' })
      return DEMO_SAVINGS
    }

    if (import.meta.env.VITE_USE_DEMO_DATA === 'true') {
      return DEMO_SAVINGS
    }

    try {
      const aggregate = await api.get<{ hours_saved: number; dollars_saved: number }>('/savings/aggregate')
      return {
        ...DEMO_SAVINGS,
        hours_saved: aggregate.hours_saved,
        dollars_saved: aggregate.dollars_saved,
      }
    } catch {
      return DEMO_SAVINGS
    }
  },
}
