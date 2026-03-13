import { STATUS_MAP, VALID_TRANSITIONS } from '../lib/constants'

function daysAgo(dateStr) {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - d) / (1000 * 60 * 60 * 24))
}

export default function ManuscriptCard({ manuscript, onSelect, onStatusChange, isDragging }) {
  const status = STATUS_MAP[manuscript.current_status] || STATUS_MAP.IDEA
  const days = daysAgo(manuscript.updated_at)
  const isStale = days >= 30 && !['ACCEPTED', 'REJECTED'].includes(manuscript.current_status)
  const transitions = VALID_TRANSITIONS[manuscript.current_status] || []

  return (
    <div
      onClick={() => onSelect(manuscript)}
      className={`bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
      } ${isStale ? 'border-amber-400 ring-1 ring-amber-200' : 'border-gray-200'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2">{manuscript.title}</h3>
        {isStale && (
          <span className="shrink-0 text-amber-500" title={`${days} days in this stage`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>

      {manuscript.authors && (
        <p className="text-xs text-gray-500 mb-1 truncate">{manuscript.authors}</p>
      )}
      {manuscript.contact_person && (
        <p className="text-xs text-gray-400 mb-2 truncate">Contact: {manuscript.contact_person}</p>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
          {status.label}
        </span>
        <span className="text-xs text-gray-400">{days}d</span>
      </div>

      {transitions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
          {transitions.map(t => {
            const ts = STATUS_MAP[t]
            return (
              <button
                key={t}
                onClick={(e) => { e.stopPropagation(); onStatusChange(manuscript, t) }}
                className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                &rarr; {ts.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
