import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  COMPUTE_POWER_OPTIONS,
  OPTIMIZATION_INTERVALS,
  OPTIMIZATION_STRATEGIES,
  RECOMMENDED_INTERVAL,
  RECOMMENDED_STRATEGY,
  optimizerApi,
} from '../api/optimizer'
import { PerformanceMetricsPanel } from './PerformanceMetricsPanel'
import { isVsCodeWebview, notifyExtensionReady, onExtensionMessage, postToExtension } from '../lib/vscode'
import type {
  ComputePower,
  HotSwapEvent,
  OptimizationInterval,
  OptimizationStrategy,
  PipelineResult,
  SavingsComparison,
} from '../types/contracts'
import { manifestToSavingsComparison } from '../api/dockerOptimizer'

function pipelineToResults(pipeline: PipelineResult): SavingsComparison {
  return manifestToSavingsComparison(pipeline.manifest, pipeline.analyze, pipeline.watch)
}

export function OptimizerPanel() {
  const [autoMode, setAutoMode] = useState(true)
  const [strategy, setStrategy] = useState<OptimizationStrategy>('multi_stage_slim')
  const [interval, setInterval] = useState<OptimizationInterval>('1h')
  const [computePower, setComputePower] = useState<ComputePower>('cpu')
  const [systemComputePower, setSystemComputePower] = useState<ComputePower>('cpu')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [results, setResults] = useState<SavingsComparison | null>(null)
  const [hotSwapEvents, setHotSwapEvents] = useState<HotSwapEvent[]>([])
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  const submitMutation = useMutation({
    mutationFn: optimizerApi.submitPreferences,
    onSuccess: (result) => {
      setStatusMessage(result.message ?? (result.ok ? 'Optimization pipeline completed.' : 'Submit failed.'))

      if (result.pipeline) {
        setResults(pipelineToResults(result.pipeline))
      } else if (result.savings) {
        setResults(result.savings)
      }

      if (result.pipeline?.watch || result.savings?.watch) {
        setHotSwapEvents([])
        setLastSyncedAt(null)
      }
    },
    onError: (error) => {
      setResults(null)
      setStatusMessage(error instanceof Error ? error.message : 'Could not reach the backend. Try again.')
    },
  })

  useEffect(() => {
    if (!isVsCodeWebview) return
    notifyExtensionReady()
    postToExtension({ type: 'getHardware' })
    return onExtensionMessage((message) => {
      if (message.type === 'savingsUpdate') {
        setResults(message.payload as SavingsComparison)
      }
      if (message.type === 'submitResult') {
        setStatusMessage(message.payload.message ?? (message.payload.ok ? 'Optimization pipeline completed.' : 'Submit failed.'))
      }
      if (message.type === 'hardwareUpdate') {
        setSystemComputePower(message.payload.compute_power)
      }
      if (message.type === 'syncEvent') {
        const event = message.payload as HotSwapEvent
        setHotSwapEvents((current) => [event, ...current].slice(0, 8))
        setLastSyncedAt(event.syncedAt)
      }
    })
  }, [])

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

  const pipelineStep = submitMutation.isPending
    ? 'Running Dockalyzer → AutoStage → HotDock…'
    : null

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
          Diagnose, optimize, and live-sync your containers through the 3-act pipeline.
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
                  {option.label} — {option.act}
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
          {submitMutation.isPending ? 'Running pipeline…' : 'Apply & start optimization'}
        </button>
        {pipelineStep ? (
          <p className="text-xs text-emerald-400">{pipelineStep}</p>
        ) : null}
        {statusMessage ? (
          <p className="text-sm text-[var(--vscode-descriptionForeground,#a1a1aa)]">{statusMessage}</p>
        ) : null}
      </section>

      <section className="panel-card space-y-4">
        <div>
          <h2 className="text-sm font-medium">Results & metrics</h2>
          <p className="text-xs text-[var(--vscode-descriptionForeground,#a1a1aa)]">
            Diagnostics, performance manifest, and live sync status from the backend.
          </p>
        </div>

        <PerformanceMetricsPanel
          analyze={results?.analyze}
          manifest={results?.manifest}
          watch={results?.watch}
          hotSwapEvents={hotSwapEvents}
          lastSyncedAt={lastSyncedAt}
          isLoading={submitMutation.isPending}
        />
      </section>
    </div>
  )
}
