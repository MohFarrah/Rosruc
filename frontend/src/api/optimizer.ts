import type {
  AnalyzeResponse,
  HotSwapEvent,
  OptimizationPreferences,
  PerformanceManifest,
  PipelineResult,
  SavingsComparison,
  SubmitPreferencesResponse,
  WatchResponse,
} from '../types/contracts'
import {
  DEMO_ANALYZE,
  DEMO_MANIFEST,
  DEMO_WATCH,
  dockerOptimizerApi,
  manifestToSavingsComparison,
} from './dockerOptimizer'
import { api } from './client'
import { isVsCodeWebview, postToExtension } from '../lib/vscode'

export const OPTIMIZATION_STRATEGIES: {
  value: OptimizationPreferences['strategy']
  label: string
  description: string
  act: string
}[] = [
  {
    value: 'layer_cache',
    label: 'Dockalyzer',
    description: 'Diagnose cache busts and pinpoint slow Dockerfile layers.',
    act: 'Act 1',
  },
  {
    value: 'multi_stage_slim',
    label: 'AutoStage',
    description: 'Tree-shake bloat and refactor the Dockerfile for faster builds.',
    act: 'Act 2',
  },
  {
    value: 'parallel_buildkit',
    label: 'HotDock',
    description: 'Enable zero-build live sync into the running container.',
    act: 'Act 3',
  },
]

export const OPTIMIZATION_INTERVALS: { value: OptimizationPreferences['interval']; label: string }[] = [
  { value: '30m', label: 'Every 30 minutes' },
  { value: '45m', label: 'Every 45 minutes' },
  { value: '1h', label: 'Every 1 hour' },
  { value: '2h', label: 'Every 2 hours' },
  { value: 'manual', label: 'Manual' },
]

export const RECOMMENDED_STRATEGY: OptimizationPreferences['strategy'] = 'multi_stage_slim'
export const RECOMMENDED_INTERVAL: OptimizationPreferences['interval'] = '1h'

export const COMPUTE_POWER_OPTIONS: {
  value: OptimizationPreferences['compute_power']
  label: string
  description: string
}[] = [
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

const DEMO_PIPELINE: PipelineResult = {
  analyze: DEMO_ANALYZE,
  manifest: DEMO_MANIFEST,
  watch: DEMO_WATCH,
}

const DEMO_SAVINGS = manifestToSavingsComparison(DEMO_MANIFEST, DEMO_ANALYZE, DEMO_WATCH)

function pipelineToResponse(
  pipeline: PipelineResult,
  message: string,
): SubmitPreferencesResponse {
  return {
    ok: true,
    message,
    pipeline,
    savings: manifestToSavingsComparison(pipeline.manifest, pipeline.analyze, pipeline.watch),
  }
}

function submitViaExtension(preferences: OptimizationPreferences): Promise<SubmitPreferencesResponse> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      resolve(pipelineToResponse(DEMO_PIPELINE, 'Preferences sent to extension host (demo pipeline).'))
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

async function runBackendPipeline(): Promise<SubmitPreferencesResponse> {
  const pipeline = await dockerOptimizerApi.runPipeline()
  return pipelineToResponse(
    pipeline,
    'Dockalyzer → AutoStage → HotDock pipeline completed.',
  )
}

export const optimizerApi = {
  submitPreferences: async (preferences: OptimizationPreferences): Promise<SubmitPreferencesResponse> => {
    if (isVsCodeWebview) {
      return submitViaExtension(preferences)
    }

    if (import.meta.env.VITE_USE_DEMO_DATA === 'true') {
      return pipelineToResponse(DEMO_PIPELINE, 'Demo pipeline completed (backend not connected).')
    }

    try {
      await api.post<SubmitPreferencesResponse>('/optimize/preferences', preferences)
    } catch {
      // Backend may not expose preferences yet — fall through to the 3-act pipeline.
    }

    try {
      return await runBackendPipeline()
    } catch {
      return pipelineToResponse(
        DEMO_PIPELINE,
        'Backend unavailable — showing demo metrics. Start docker-optimizer API on port 8000.',
      )
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
      await dockerOptimizerApi.health()
      return DEMO_SAVINGS
    } catch {
      return DEMO_SAVINGS
    }
  },
}

export type { AnalyzeResponse, HotSwapEvent, PerformanceManifest, PipelineResult, WatchResponse }
