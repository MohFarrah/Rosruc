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
