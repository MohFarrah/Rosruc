import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  COMPUTE_POWER_OPTIONS,
  OPTIMIZATION_INTERVALS,
  OPTIMIZATION_STRATEGIES,
  RECOMMENDED_INTERVAL,
  RECOMMENDED_STRATEGY,
  optimizerApi,
} from '../api/optimizer'
import { isVsCodeWebview, notifyExtensionReady, onExtensionMessage, postToExtension } from '../lib/vscode'
import type { ComputePower, OptimizationInterval, OptimizationStrategy, SavingsComparison } from '../types/contracts'

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainder = Math.round(minutes % 60)
    return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`
  }
  return `${Math.round(minutes)}m`
}

export function OptimizerPanel() {
  const [autoMode, setAutoMode] = useState(true)
  const [strategy, setStrategy] = useState<OptimizationStrategy>('layer_cache')
  const [interval, setInterval] = useState<OptimizationInterval>('1h')
  const [computePower, setComputePower] = useState<ComputePower>('cpu')
  const [systemComputePower, setSystemComputePower] = useState<ComputePower>('cpu')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [liveSavings, setLiveSavings] = useState<SavingsComparison | null>(null)

  const savingsQuery = useQuery({
    queryKey: ['optimizer', 'savings'],
    queryFn: optimizerApi.getSavingsComparison,
  })

  const submitMutation = useMutation({
    mutationFn: optimizerApi.submitPreferences,
    onSuccess: (result) => {
      setStatusMessage(result.message ?? (result.ok ? 'Optimization started.' : 'Submit failed.'))
      if (result.savings) {
        setLiveSavings(result.savings)
      }
    },
    onError: () => {
      setStatusMessage('Could not reach the backend. Try again.')
    },
  })

  useEffect(() => {
    if (!isVsCodeWebview) return
    notifyExtensionReady()
    postToExtension({ type: 'getHardware' })
    return onExtensionMessage((message) => {
      if (message.type === 'savingsUpdate') {
        setLiveSavings(message.payload as SavingsComparison)
      }
      if (message.type === 'submitResult') {
        setStatusMessage(message.payload.message ?? (message.payload.ok ? 'Optimization started.' : 'Submit failed.'))
      }
      if (message.type === 'hardwareUpdate') {
        setSystemComputePower(message.payload.compute_power)
      }
    })
  }, [])

  const savings = liveSavings ?? savingsQuery.data ?? null
  const controlsLocked = autoMode
  const displayedStrategy = autoMode ? RECOMMENDED_STRATEGY : strategy
  const displayedInterval = autoMode ? RECOMMENDED_INTERVAL : interval
  const displayedComputePower = autoMode ? systemComputePower : computePower
  const displayedStrategyMeta = OPTIMIZATION_STRATEGIES.find((option) => option.value === displayedStrategy)
  const displayedComputeMeta = COMPUTE_POWER_OPTIONS.find((option) => option.value === displayedComputePower)

  const handleSubmit = () => {
    setStatusMessage(null)
    submitMutation.mutate({
      auto_mode: autoMode,
      strategy: displayedStrategy,
      interval: displayedInterval,
      compute_power: displayedComputePower,
    })
  }

  return (
    <div className="optimizer-panel mx-auto max-w-xl space-y-5 p-4">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--vscode-descriptionForeground,#a1a1aa)]">
          Rosruc
        </p>
        <h1 className="text-lg font-semibold text-[var(--vscode-foreground,#fafafa)]">
          Docker optimization
        </h1>
        <p className="text-sm text-[var(--vscode-descriptionForeground,#a1a1aa)]">
          Choose how containers are optimized and when the workflow runs.
        </p>
      </header>

      <section className="panel-card space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Run mode</p>
            <p className="text-xs text-[var(--vscode-descriptionForeground,#a1a1aa)]">
              {autoMode
                ? 'The system picks the recommended strategy, schedule, and compute power.'
                : 'Choose your strategy, schedule, and CPU or GPU power.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoMode}
            aria-label={autoMode ? 'Auto mode enabled' : 'Manual mode enabled'}
            onClick={() => setAutoMode((value) => !value)}
            className={`mode-switch ${autoMode ? 'mode-switch--auto' : 'mode-switch--manual'}`}
          >
            <span className="mode-switch__label">{autoMode ? 'Auto' : 'Manual'}</span>
            <span className="mode-switch__thumb" />
          </button>
        </div>
      </section>

      <section className={`panel-card space-y-3 ${controlsLocked ? 'panel-card--locked' : ''}`}>
        {controlsLocked ? (
          <p className="text-xs text-[var(--vscode-descriptionForeground,#a1a1aa)]">
            Recommended by the system — switch to Manual to customize.
          </p>
        ) : null}
        <div className="flex gap-2">
          <label className={`flex w-2/3 flex-col gap-1.5 ${controlsLocked ? 'field-group--locked' : ''}`}>
            <span className="text-sm font-medium">Optimization strategy</span>
            <select
              className="field-select"
              value={displayedStrategy}
              disabled={controlsLocked}
              onChange={(event) => setStrategy(event.target.value as OptimizationStrategy)}
            >
              {OPTIMIZATION_STRATEGIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-[var(--vscode-descriptionForeground,#a1a1aa)]">
              {displayedStrategyMeta?.description}
            </span>
          </label>

          <label className={`flex w-1/3 flex-col gap-1.5 ${controlsLocked ? 'field-group--locked' : ''}`}>
            <span className="text-sm font-medium">How often?</span>
            <select
              className="field-select"
              value={displayedInterval}
              disabled={controlsLocked}
              onChange={(event) => setInterval(event.target.value as OptimizationInterval)}
            >
              {OPTIMIZATION_INTERVALS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={`flex flex-col gap-2 ${controlsLocked ? 'field-group--locked' : ''}`}>
          <span className="text-sm font-medium">Compute power</span>
          <div className="compute-power-group" role="radiogroup" aria-label="Compute power">
            {COMPUTE_POWER_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`compute-power-option ${displayedComputePower === option.value ? 'compute-power-option--active' : ''}`}
              >
                <input
                  type="radio"
                  name="compute-power"
                  value={option.value}
                  checked={displayedComputePower === option.value}
                  disabled={controlsLocked}
                  onChange={() => setComputePower(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <span className="text-xs text-[var(--vscode-descriptionForeground,#a1a1aa)]">
            {controlsLocked
              ? `Assigned automatically based on your hardware (${displayedComputeMeta?.label}).`
              : displayedComputeMeta?.description}
          </span>
        </label>
      </section>

      <section className="panel-card space-y-3">
        <button
          type="button"
          className="primary-button w-full"
          disabled={submitMutation.isPending}
          onClick={handleSubmit}
        >
          {submitMutation.isPending ? 'Starting…' : 'Apply & start optimization'}
        </button>
        {statusMessage ? (
          <p className="text-sm text-[var(--vscode-descriptionForeground,#a1a1aa)]">{statusMessage}</p>
        ) : null}
      </section>

      <section className="panel-card space-y-4">
        <div>
          <h2 className="text-sm font-medium">Savings comparison</h2>
          <p className="text-xs text-[var(--vscode-descriptionForeground,#a1a1aa)]">
            Baseline vs optimized container build times.
          </p>
        </div>

        {savingsQuery.isLoading && !savings ? (
          <p className="text-sm text-[var(--vscode-descriptionForeground,#a1a1aa)]">Loading savings…</p>
        ) : savings ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Minutes saved" value={formatMinutes(savings.minutes_saved)} accent />
              <MetricCard label="Hours saved" value={`${savings.hours_saved.toFixed(1)}h`} accent />
              <MetricCard label="Dollars saved" value={`$${savings.dollars_saved.toFixed(2)}`} accent />
              <MetricCard
                label="Build time reduction"
                value={`${Math.round((savings.minutes_saved / savings.baseline_minutes) * 100)}%`}
              />
            </div>

            <div className="comparison-grid">
              <ComparisonRow label="Before" minutes={savings.baseline_minutes} maxMinutes={savings.baseline_minutes} tone="before" />
              <ComparisonRow label="After" minutes={savings.optimized_minutes} maxMinutes={savings.baseline_minutes} tone="after" />
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--vscode-descriptionForeground,#a1a1aa)]">
            Run an optimization to see savings.
          </p>
        )}
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="metric-card">
      <p className="text-xs text-[var(--vscode-descriptionForeground,#a1a1aa)]">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent ? 'text-emerald-400' : ''}`}>{value}</p>
    </div>
  )
}

function ComparisonRow({
  label,
  minutes,
  maxMinutes,
  tone,
}: {
  label: string
  minutes: number
  maxMinutes: number
  tone: 'before' | 'after'
}) {
  const width = Math.max(12, Math.round((minutes / maxMinutes) * 100))

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--vscode-descriptionForeground,#a1a1aa)]">{label}</span>
        <span className="font-medium">{formatMinutes(minutes)}</span>
      </div>
      <div className="comparison-track">
        <div
          className={`comparison-bar comparison-bar--${tone}`}
          style={{ width: `${Math.min(width, 100)}%` }}
        />
      </div>
    </div>
  )
}
