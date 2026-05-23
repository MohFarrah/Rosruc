import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { intentsApi } from '../api/intents'

export function Inbox() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['intents'],
    queryFn: intentsApi.list,
  })

  if (isLoading) return <p className="text-zinc-400">Loading intents…</p>
  if (error) return <p className="text-red-400">Failed to load intents. Is the backend running on :8000?</p>

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Intent inbox</h2>
        <p className="text-zinc-400">Pick a Jira ticket + linked PR to analyze.</p>
      </div>
      <div className="grid gap-4">
        {data?.map((intent) => (
          <Link
            key={intent.id}
            to={`/intents/${intent.id}`}
            className="block rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-emerald-500/40"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">{intent.ticket_id}</p>
                <h3 className="mt-1 text-lg font-medium">{intent.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{intent.pr_title}</p>
              </div>
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">{intent.pr_id}</span>
            </div>
          </Link>
        ))}
        {!data?.length && (
          <p className="text-zinc-500">No intents yet. Add fixtures under optimizer/demo/intents/.</p>
        )}
      </div>
    </section>
  )
}
