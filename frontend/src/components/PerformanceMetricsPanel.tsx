import type {
  AnalyzeResponse,
  HotSwapEvent,
  PerformanceManifest,
  WatchResponse,
} from '../types/contracts'

function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(1)}s`
}

function formatMegabytes(mb: number): string {
  return `${mb.toFixed(1)} MB`
}

export function PerformanceMetricsPanel({
  analyze,
  manifest,
  watch,
  hotSwapEvents = [],
  lastSyncedAt,
}: {
  analyze?: AnalyzeResponse
  manifest?: PerformanceManifest
  watch?: WatchResponse
  hotSwapEvents?: HotSwapEvent[]
  lastSyncedAt?: string | null
}) {
  if (!manifest && !analyze && !watch) {
    return (
      <p className="text-sm text-[var(--vscode-descriptionForeground,#a1a1aa)]">
        Run an optimization to see diagnostics and performance metrics.
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
              label="Cache bust line"
              value={analyze.busted_line ?? 'No bust detected'}
              accent={Boolean(analyze.busted_line)}
            />
            <MetricCard
              label="Scan status"
              value={analyze.status === 'success' ? 'Cache bust found' : 'Already optimized'}
            />
          </div>
        </section>
      ) : null}

      {manifest ? (
        <section className="act-section">
          <div className="act-section__header">
            <span className="act-badge act-badge--optimize">Act 2</span>
            <h3 className="text-sm font-medium">AutoStage performance manifest</h3>
          </div>

          <div className="badge-row">
            <ImprovementBadge label="Build speed" value={manifest.savings.time} />
            <ImprovementBadge label="Image size" value={manifest.savings.size} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Build time saved" value={manifest.savings.time} accent />
            <MetricCard label="Image size saved" value={manifest.savings.size} accent />
            {buildTime ? (
              <MetricCard
                label="Build before → after"
                value={`${formatSeconds(buildTime.before)} → ${formatSeconds(buildTime.after)}`}
              />
            ) : null}
            {imageSize ? (
              <MetricCard
                label="Size before → after"
                value={`${formatMegabytes(imageSize.before)} → ${formatMegabytes(imageSize.after)}`}
              />
            ) : null}
          </div>

          {buildTime ? (
            <div className="comparison-grid">
              <ComparisonRow
                label="Build time (before)"
                value={buildTime.before}
                maxValue={buildTime.before}
                formatter={formatSeconds}
                tone="before"
              />
              <ComparisonRow
                label="Build time (after)"
                value={buildTime.after}
                maxValue={buildTime.before}
                formatter={formatSeconds}
                tone="after"
              />
            </div>
          ) : null}

          {imageSize ? (
            <div className="comparison-grid">
              <ComparisonRow
                label="Image size (before)"
                value={imageSize.before}
                maxValue={imageSize.before}
                formatter={formatMegabytes}
                tone="before"
              />
              <ComparisonRow
                label="Image size (after)"
                value={imageSize.after}
                maxValue={imageSize.before}
                formatter={formatMegabytes}
                tone="after"
              />
            </div>
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

function ImprovementBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="improvement-badge">
      <span>{label}</span>
      <strong>{value}</strong>
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
