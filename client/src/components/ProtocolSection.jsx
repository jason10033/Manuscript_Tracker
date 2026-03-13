import { useState, useRef, useEffect } from 'react'

export default function ProtocolSection({ section, protocolId, onUpdate }) {
  const [content, setContent] = useState(section.content || '')
  const [showNotes, setShowNotes] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef(null)
  const saveTimerRef = useRef(null)

  // Sync content when section changes
  useEffect(() => {
    setContent(section.content || '')
  }, [section.id, section.content])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.max(200, textareaRef.current.scrollHeight) + 'px'
    }
  }, [content])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const status = content.trim() ? (content.trim().length > 50 ? 'complete' : 'in_progress') : 'not_started'
      await onUpdate(section.id, { content, status })
    } catch (err) {
      setError('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleContentChange = (e) => {
    setContent(e.target.value)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      handleSave()
    }, 2000)
  }

  const statusColors = {
    not_started: 'bg-gray-200 text-gray-600',
    in_progress: 'bg-yellow-100 text-yellow-700',
    complete: 'bg-green-100 text-green-700',
  }

  const statusLabels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    complete: 'Complete',
  }

  const hasUserNotes = section.user_notes && section.user_notes.trim()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{section.section_title}</h3>
              <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[section.status] || statusColors.not_started}`}>
                {statusLabels[section.status] || 'Not Started'}
              </span>
            </div>
          </div>
        </div>

        {/* Your Notes (collapsible) */}
        {hasUserNotes && (
          <div className="px-5 pt-4">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-sm text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"
            >
              <svg className={`w-4 h-4 transition-transform ${showNotes ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Your Original Notes
            </button>
            {showNotes && (
              <div className="mt-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-800 border border-amber-100 whitespace-pre-wrap">
                {section.user_notes}
              </div>
            )}
          </div>
        )}

        {/* Content Editor */}
        <div className="p-5">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onBlur={handleSave}
            placeholder="Generated content will appear here. You can edit it manually."
            className="w-full min-h-[200px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm leading-relaxed resize-none font-mono"
          />

          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {saving && <span className="text-xs text-gray-400">Saving...</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
