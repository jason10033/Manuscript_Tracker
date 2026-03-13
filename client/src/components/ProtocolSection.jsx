import { useState, useRef, useEffect } from 'react'

export default function ProtocolSection({ section, protocolId, onUpdate, onGenerate }) {
  const [content, setContent] = useState(section.content || '')
  const [additionalContext, setAdditionalContext] = useState('')
  const [showGuideline, setShowGuideline] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showContextInput, setShowContextInput] = useState(false)
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
    // Debounced auto-save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      handleSave()
    }, 2000)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const result = await onGenerate(section.id, additionalContext || undefined)
      if (result.generatedContent) {
        setContent(result.generatedContent)
        // Auto-save the generated content
        const status = 'in_progress'
        await onUpdate(section.id, { content: result.generatedContent, status })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
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

  return (
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
          <button
            onClick={() => setShowGuideline(!showGuideline)}
            className="text-sm text-blue-600 hover:text-blue-800 shrink-0 ml-4"
          >
            {showGuideline ? 'Hide' : 'Show'} Guideline
          </button>
        </div>

        {showGuideline && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-100">
            <strong>Guideline:</strong> {section.guideline_text}
          </div>
        )}
      </div>

      {/* Content Editor */}
      <div className="p-5">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onBlur={handleSave}
          placeholder="Write or generate content for this section..."
          className="w-full min-h-[200px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm leading-relaxed resize-none font-mono"
        />

        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowContextInput(!showContextInput)}
            disabled={generating}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate with AI
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          {saving && <span className="text-xs text-gray-400">Saving...</span>}
        </div>

        {/* AI Context Input */}
        {showContextInput && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional context for AI (optional)
            </label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="e.g., This is a Phase 2 trial for a novel cancer immunotherapy targeting PD-L1..."
              className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none h-24 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate'
                )}
              </button>
              <button
                onClick={() => setShowContextInput(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
