import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { savingsApi } from '../api/savings'

export function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['savings', 'aggregate'],
    queryFn: savingsApi.aggregate,
  })

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Sprint savings</h2>
        <p className="text-zinc-400">Aggregate compute and wall-clock reduction from optimized CI runs.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Hours saved</p>
          <p className="mt-2 text-4xl font-semibold text-emerald-400">
            {isLoading ? '…' : error ? '—' : `${data?.hours_saved.toFixed(1)}h`}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Dollars saved</p>
          <p className="mt-2 text-4xl font-semibold text-emerald-400">
            {isLoading ? '…' : error ? '—' : `$${data?.dollars_saved.toFixed(2)}`}
          </p>
        </div>
      </div>
      <Link
        to="/inbox"
        className="inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
      >
        Open intent inbox
      </Link>
    </section>
  )
}
