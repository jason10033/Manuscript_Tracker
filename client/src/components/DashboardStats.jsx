import { STATUSES, STATUS_MAP } from '../lib/constants'

export default function DashboardStats({ manuscripts }) {
  if (manuscripts.length === 0) return null

  const counts = {}
  STATUSES.forEach(s => { counts[s.key] = 0 })
  manuscripts.forEach(m => {
    counts[m.current_status] = (counts[m.current_status] || 0) + 1
  })

  const maxCount = Math.max(...Object.values(counts), 1)

  return (
    <div className="mb-6">
      <div className="grid grid-cols-7 gap-2">
        {STATUSES.map(s => {
          const count = counts[s.key] || 0
          const pct = (count / maxCount) * 100

          return (
            <div key={s.key} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 truncate">{s.label}</span>
                <span className="text-lg font-bold text-gray-900">{count}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.color.split(' ')[0]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
