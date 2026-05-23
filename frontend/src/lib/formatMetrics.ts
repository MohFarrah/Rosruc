/** Format build duration in seconds to a human-readable string. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'

  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`
  }

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60)
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`
}

/** Format image size in megabytes to KB, MB, or GB. */
export function formatBytesFromMegabytes(mb: number): string {
  if (!Number.isFinite(mb) || mb < 0) return '—'

  if (mb < 1) {
    return `${Math.round(mb * 1024)} KB`
  }

  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`
  }

  return `${mb.toFixed(1)} MB`
}

export function formatAnalyzeStatus(status: string, bustedLine: string | null | undefined): string {
  if (!bustedLine) {
    return status === 'optimized' ? 'All layers cached' : 'No cache bust detected'
  }

  return 'Cache bust detected'
}
