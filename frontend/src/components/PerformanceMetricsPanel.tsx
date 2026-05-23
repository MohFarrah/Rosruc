import type {
  AnalyzeResponse,
  HotSwapEvent,
  PerformanceManifest,
  WatchResponse,
} from '../types/contracts'
import {
  formatAnalyzeStatus,
  formatBytesFromMegabytes,
  formatDuration,
} from '../lib/formatMetrics'

export function PerformanceMetricsPanel({
  analyze,
  manifest,
  watch,
  hotSwapEvents = [],
  lastSyncedAt,
  isLoading = false,
}: {
  analyze?: AnalyzeResponse
  manifest?: PerformanceManifest
  watch?: WatchResponse
  hotSwapEvents?: HotSwapEvent[]
  lastSyncedAt?: string | null
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <p className="text-sm text-[var(--vscode-descriptionForeground,#a1a1aa)]">
        Running optimizer pipeline…
      </p>
    )
  }

  if (!manifest && !analyze && !watch) {
    return (
      <p className="text-sm text-[var(--vscode-descriptionForeground,#a1a1aa)]">
        Apply & start optimization to load results from the backend.
      </p>
    )
  }

  const buildTime = manifest?.metrics.build_time
  const imageSize = manifest?.metrics.image_size

  return (
    <div className="space-y-4">
      {analyze ? (
        <section className="act-section">
          <div className="act-section__header">
            <span className="act-badge act-badge--diagnose">Act 1</span>
            <h3 className="text-sm font-medium">Dockalyzer diagnostics</h3>
          </div>
          <div className="diagnostic-grid">
            <MetricCard
              label="Cache bust instruction"
              value={analyze.busted_line ?? 'None — build reused all layers'}
              accent={Boolean(analyze.busted_line)}
            />
            <MetricCard
              label="Scan status"
              value={formatAnalyzeStatus(analyze.status, analyze.busted_line)}
            />
          </div>
          <p className="text-xs text-[var(--vscode-descriptionForeground,#a1a1aa)]">
            The cache bust instruction is the Dockerfile step where Docker stopped reusing cached
            layers and rebuilt from that point onward.
          </p>
        </section>
      ) : null}

      {manifest ? (
        <section className="act-section">
          <div className="act-section__header">
            <span className="act-badge act-badge--optimize">Act 2</span>
            <h3 className="text-sm font-medium">AutoStage performance manifest</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {buildTime ? (
              <MetricCard label="Build time" value={formatDuration(buildTime.after)} accent />
            ) : null}
            {imageSize ? (
              <MetricCard label="Image size" value={formatBytesFromMegabytes(imageSize.after)} accent />
            ) : null}
            <MetricCard label="Build time saved" value={manifest.savings.time} />
            <MetricCard label="Image size saved" value={manifest.savings.size} />
          </div>

          {imageSize ? (
            <div className="comparison-grid">
              <ComparisonRow
                label="Image size (before)"
                value={imageSize.before}
                maxValue={imageSize.before}
                formatter={formatBytesFromMegabytes}
                tone="before"
              />
              <ComparisonRow
                label="Image size (after)"
                value={imageSize.after}
                maxValue={imageSize.before}
                formatter={formatBytesFromMegabytes}
                tone="after"
              />
            </div>
          ) : null}

          {buildTime ? (
            <p className="text-xs text-[var(--vscode-descriptionForeground,#a1a1aa)]">
              Build went from {formatDuration(buildTime.before)} to {formatDuration(buildTime.after)}.
            </p>
          ) : null}

          <div className="bloat-panel">
            <span className="text-xs uppercase tracking-wide text-[var(--vscode-descriptionForeground,#a1a1aa)]">
              Bloat removed
            </span>
            <p className="mt-1 text-sm">{manifest.bloat_removed}</p>
          </div>
        </section>
      ) : null}

      {watch ? (
        <section className="act-section">
          <div className="act-section__header">
            <span className="act-badge act-badge--sync">Act 3</span>
            <h3 className="text-sm font-medium">HotDock live sync</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Status" value={watch.status} accent />
            <MetricCard label="Container" value={watch.container} />
            <MetricCard
              label="Last synced"
              value={lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'Waiting for file saves…'}
            />
            <MetricCard label="Hot-swaps" value={String(hotSwapEvents.length)} />
          </div>

          {hotSwapEvents.length > 0 ? (
            <ul className="sync-event-list">
              {hotSwapEvents.map((event) => (
                <li key={`${event.syncedAt}-${event.filename}`} className="sync-event sync-event--pulse">
                  {event.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--vscode-descriptionForeground,#a1a1aa)]">
              Save a file in your project to see ⚡ Hot-Swap events here.
            </p>
          )}
        </section>
      ) : null}
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
      <p className={`mt-1 text-sm font-semibold leading-snug ${accent ? 'text-emerald-400' : ''}`}>{value}</p>
    </div>
  )
}

function ComparisonRow({
  label,
  value,
  maxValue,
  formatter,
  tone,
}: {
  label: string
  value: number
  maxValue: number
  formatter: (value: number) => string
  tone: 'before' | 'after'
}) {
  const width = Math.max(12, Math.round((value / maxValue) * 100))

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--vscode-descriptionForeground,#a1a1aa)]">{label}</span>
        <span className="font-medium">{formatter(value)}</span>
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
