import { STATUSES, STATUS_MAP, VALID_TRANSITIONS } from '../lib/constants'
import ManuscriptCard from './ManuscriptCard'

export default function KanbanBoard({ manuscripts, onStatusChange, onSelect }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
      {STATUSES.map(status => {
        const items = manuscripts.filter(m => m.current_status === status.key)
        return (
          <div
            key={status.key}
            className={`flex-shrink-0 w-72 bg-gray-100 rounded-xl border-t-4 ${status.columnColor}`}
          >
            <div className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-gray-700">{status.label}</h2>
                <span className="text-xs bg-white text-gray-500 rounded-full px-2 py-0.5 font-medium">
                  {items.length}
                </span>
              </div>
            </div>
            <div className="p-2 pt-0 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">No manuscripts</div>
              ) : (
                items.map(m => (
                  <ManuscriptCard
                    key={m.id}
                    manuscript={m}
                    onSelect={onSelect}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
