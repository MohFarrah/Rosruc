export interface Intent {
  id: string
  source: string
  ticket_id: string
  title: string
  body: string
  pr_id: string
  pr_title: string
  pr_diff_files: string[]
  created_at?: string
}

export interface Analysis {
  id: string
  intent_id: string
  primary_services: string[]
  dependent_services: string[]
  skipped_services: string[]
  skipped_test_suites: string[]
  confidence: number
  rationale: string
  cache_hit?: boolean
}

export interface Plan {
  id: string
  analysis_id: string
  intent_id?: string
  baseline_minutes: number
  optimized_minutes: number
  minutes_saved: number
  dollars_saved: number
  yaml: string
  approved: boolean
  approved_at?: string
}

export interface ExecutionJob {
  id: string
  execution_id: string
  service: string
  kind: string
  status: string
  duration_seconds_estimated: number
  duration_seconds_actual?: number
  skipped_reason?: string | null
}

export interface Execution {
  id: string
  plan_id: string
  status: string
  jobs: ExecutionJob[]
}

export interface AggregateSavings {
  hours_saved: number
  dollars_saved: number
  runs_count: number
  sparkline: number[]
}

export type OptimizationStrategy =
  | 'layer_cache'
  | 'multi_stage_slim'
  | 'parallel_buildkit'

export type OptimizationInterval =
  | '30m'
  | '45m'
  | '1h'
  | '2h'
  | 'manual'

export type ComputePower = 'cpu' | 'gpu'

export interface OptimizationPreferences {
  auto_mode: boolean
  strategy: OptimizationStrategy
  interval: OptimizationInterval
  compute_power: ComputePower
}

export interface MetricPair {
  before: number
  after: number
}

export interface PerformanceManifest {
  metrics: {
    build_time: MetricPair
    image_size: MetricPair
  }
  savings: {
    time: string
    size: string
  }
  bloat_removed: string
}

export interface AnalyzeResponse {
  busted_line: string | null
  status: 'success' | 'optimized' | string
}

export interface WatchResponse {
  status: string
  container: string
}

export interface HotSwapEvent {
  filename: string
  durationMs: number
  message: string
  syncedAt: string
}

export interface PipelineResult {
  analyze: AnalyzeResponse
  manifest: PerformanceManifest
  watch: WatchResponse
}

export interface SavingsComparison {
  baseline_minutes: number
  optimized_minutes: number
  minutes_saved: number
  hours_saved: number
  dollars_saved: number
  manifest?: PerformanceManifest
  analyze?: AnalyzeResponse
  watch?: WatchResponse
  hotSwapEvents?: HotSwapEvent[]
}

export interface SubmitPreferencesResponse {
  ok: boolean
  message?: string
  execution_id?: string
  savings?: SavingsComparison
  pipeline?: PipelineResult
}
