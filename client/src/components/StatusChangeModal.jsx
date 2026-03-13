import { useState } from 'react'
import { STATUS_MAP } from '../lib/constants'

export default function StatusChangeModal({ manuscript, newStatus, onSubmit, onClose }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [journal, setJournal] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const statusInfo = STATUS_MAP[newStatus]
  const needsJournal = ['SUBMITTED', 'REVISE_RESUBMIT', 'REJECTED', 'ACCEPTED'].includes(newStatus)

  // Pre-fill journal from last event if available
  const lastJournal = manuscript.events
    ?.slice()
    .reverse()
    .find(e => e.journal)?.journal || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        date: date || undefined,
        journal: journal || (needsJournal ? lastJournal : ''),
        notes,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Update Status</h2>
          <p className="text-sm text-gray-500 mb-4">
            Moving <strong>{manuscript.title}</strong> to{' '}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {needsJournal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
                <input
                  type="text"
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder={lastJournal || 'e.g., Nature, Science, PNAS'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any details about this status change..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
