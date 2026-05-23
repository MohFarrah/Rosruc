import type {
  AnalyzeResponse,
  PerformanceManifest,
  PipelineResult,
  SavingsComparison,
  WatchResponse,
} from '../types/contracts'
import { api } from './client'

export const DEMO_MANIFEST: PerformanceManifest = {
  metrics: {
    build_time: { before: 45.2, after: 12.1 },
    image_size: { before: 950.0, after: 120.0 },
  },
  savings: {
    time: '73.2%',
    size: '87.4%',
  },
  bloat_removed: 'Removed: git, vim, gcc, wget, build-essential, curl',
}

export const DEMO_ANALYZE: AnalyzeResponse = {
  busted_line: 'COPY . .',
  status: 'success',
}

export const DEMO_WATCH: WatchResponse = {
  status: 'Live Sync Started',
  container: 'autostage-dev-container',
}

export function manifestToSavingsComparison(
  manifest: PerformanceManifest,
  analyze?: AnalyzeResponse,
  watch?: WatchResponse,
): SavingsComparison {
  const { build_time, image_size } = manifest.metrics
  const minutesSaved = Math.max(0, (build_time.before - build_time.after) / 60)
  const hoursSaved = minutesSaved / 60
  const sizeSavedMb = Math.max(0, image_size.before - image_size.after)

  return {
    baseline_minutes: build_time.before / 60,
    optimized_minutes: build_time.after / 60,
    minutes_saved: minutesSaved,
    hours_saved: hoursSaved,
    dollars_saved: Math.round(sizeSavedMb * 0.12 * 100) / 100,
    manifest,
    analyze,
    watch,
  }
}

export const dockerOptimizerApi = {
  health: () => api.get<{ status: string }>('/health'),

  analyze: () => api.post<AnalyzeResponse>('/analyze'),

  optimize: () => api.post<PerformanceManifest>('/optimize'),

  watch: () => api.post<WatchResponse>('/watch'),

  runPipeline: async (): Promise<PipelineResult> => {
    const analyze = await dockerOptimizerApi.analyze()
    const manifest = await dockerOptimizerApi.optimize()
    const watch = await dockerOptimizerApi.watch()
    return { analyze, manifest, watch }
  },

  getDemoPipeline: (): PipelineResult => ({
    analyze: DEMO_ANALYZE,
    manifest: DEMO_MANIFEST,
    watch: DEMO_WATCH,
  }),
}
