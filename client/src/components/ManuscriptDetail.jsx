import { useState } from 'react'
import { STATUS_MAP, VALID_TRANSITIONS } from '../lib/constants'

function daysAgo(dateStr) {
  if (!dateStr) return 0
  return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
}

function daysBetween(d1, d2) {
  return Math.floor((new Date(d2) - new Date(d1)) / (1000 * 60 * 60 * 24))
}

export default function ManuscriptDetail({ manuscript, onClose, onStatusChange, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: manuscript.title,
    authors: manuscript.authors,
    contact_person: manuscript.contact_person,
    contact_email: manuscript.contact_email,
  })

  const status = STATUS_MAP[manuscript.current_status] || STATUS_MAP.IDEA
  const transitions = VALID_TRANSITIONS[manuscript.current_status] || []
  const totalDays = daysAgo(manuscript.created_at)
  const daysInStage = daysAgo(manuscript.updated_at)

  const handleSave = () => {
    onUpdate(manuscript.id, editData)
    setEditing(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h2 className="font-semibold text-gray-900">Manuscript Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(manuscript.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Delete
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Metadata */}
          <div className="space-y-3">
            {editing ? (
              <div className="space-y-3">
                <input
                  value={editData.title}
                  onChange={e => setEditData({ ...editData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Title"
                />
                <input
                  value={editData.authors}
                  onChange={e => setEditData({ ...editData, authors: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Authors"
                />
                <input
                  value={editData.contact_person}
                  onChange={e => setEditData({ ...editData, contact_person: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Contact person"
                />
                <input
                  value={editData.contact_email}
                  onChange={e => setEditData({ ...editData, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Contact email"
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg">Save</button>
                  <button onClick={() => setEditing(false)} className="text-sm px-3 py-1 text-gray-600">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{manuscript.title}</h3>
                  <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:text-blue-800">
                    Edit
                  </button>
                </div>
                {manuscript.authors && <p className="text-sm text-gray-600">{manuscript.authors}</p>}
                {manuscript.contact_person && (
                  <p className="text-sm text-gray-500">
                    Contact: {manuscript.contact_person}
                    {manuscript.contact_email && ` (${manuscript.contact_email})`}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Status & Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${status.color}`}>
                {status.label}
              </div>
              <p className="text-xs text-gray-500 mt-1">Current Status</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{totalDays}</div>
              <p className="text-xs text-gray-500">Total Days</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{daysInStage}</div>
              <p className="text-xs text-gray-500">Days in Stage</p>
            </div>
          </div>

          {/* Quick Actions */}
          {transitions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Move to:</h4>
              <div className="flex flex-wrap gap-2">
                {transitions.map(t => {
                  const ts = STATUS_MAP[t]
                  return (
                    <button
                      key={t}
                      onClick={() => onStatusChange(manuscript, t)}
                      className={`text-sm px-3 py-1.5 rounded-lg font-medium ${ts.color} hover:opacity-80 transition-opacity`}
                    >
                      {ts.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Timeline</h4>
            <div className="space-y-0">
              {(manuscript.events || []).map((event, i, arr) => {
                const es = STATUS_MAP[event.status] || STATUS_MAP.IDEA
                const nextDate = arr[i + 1]?.date
                const duration = nextDate ? daysBetween(event.date, nextDate) : null

                return (
                  <div key={event.id} className="relative pl-6 pb-4">
                    {i < arr.length - 1 && (
                      <div className="absolute left-[9px] top-4 bottom-0 w-0.5 bg-gray-200" />
                    )}
                    <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full border-2 border-gray-300 bg-white" />
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${es.color}`}>
                          {es.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      {event.journal && (
                        <p className="text-xs text-gray-600 mt-1">Journal: {event.journal}</p>
                      )}
                      {event.round_number > 0 && (
                        <p className="text-xs text-gray-600">Round {event.round_number}</p>
                      )}
                      {event.notes && (
                        <p className="text-sm text-gray-700 mt-1">{event.notes}</p>
                      )}
                      {duration !== null && (
                        <p className="text-xs text-gray-400 mt-1">{duration} days in this stage</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
