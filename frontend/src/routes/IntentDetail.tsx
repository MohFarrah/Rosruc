import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { intentsApi } from '../api/intents'

export function IntentDetail() {
  const { id = '' } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['intents', id],
    queryFn: () => intentsApi.get(id),
    enabled: Boolean(id),
  })

  const analyze = useMutation({
    mutationFn: () => intentsApi.analyze(id),
  })

  if (isLoading) return <p className="text-zinc-400">Loading intent…</p>
  if (error || !data) return <p className="text-red-400">Intent not found.</p>

  return (
    <section className="space-y-6">
      <Link to="/inbox" className="text-sm text-zinc-400 hover:text-zinc-200">
        ← Back to inbox
      </Link>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{data.ticket_id}</p>
        <h2 className="mt-1 text-2xl font-semibold">{data.title}</h2>
        <p className="mt-4 whitespace-pre-wrap text-zinc-300">{data.body}</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{data.pr_id}</p>
        <h3 className="mt-1 text-lg font-medium">{data.pr_title}</h3>
        <ul className="mt-4 space-y-2 font-mono text-sm text-zinc-400">
          {data.pr_diff_files.map((file) => (
            <li key={file} className="rounded bg-zinc-950 px-3 py-2">{file}</li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => analyze.mutate()}
        disabled={analyze.isPending}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {analyze.isPending ? 'Analyzing…' : 'Analyze impact'}
      </button>
      {analyze.data && (
        <pre className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300">
          {JSON.stringify(analyze.data, null, 2)}
        </pre>
      )}
    </section>
  )
}
