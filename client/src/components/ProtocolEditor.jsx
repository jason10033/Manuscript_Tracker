import { useState, useEffect } from 'react'
import { protocolApi } from '../lib/api'
import ProtocolSection from './ProtocolSection'
import ProtocolWizard from './ProtocolWizard'

export default function ProtocolEditor({ protocolId, onBack }) {
  const [protocol, setProtocol] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  // Revision state
  const [showRevisionPanel, setShowRevisionPanel] = useState(false)
  const [revisionFeedback, setRevisionFeedback] = useState('')
  const [revising, setRevising] = useState(false)
  const [revisionError, setRevisionError] = useState('')

  useEffect(() => {
    loadProtocol()
  }, [protocolId])

  const loadProtocol = async () => {
    setLoading(true)
    try {
      const data = await protocolApi.get(protocolId)
      setProtocol(data)
      setTitleValue(data.title)
      if (!activeSectionId && data.sections?.length > 0) {
        setActiveSectionId(data.sections[0].id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSection = async (sectionId, data) => {
    await protocolApi.updateSection(protocolId, sectionId, data)
    await loadProtocol()
  }

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue !== protocol.title) {
      await protocolApi.update(protocolId, { title: titleValue.trim() })
      await loadProtocol()
    }
    setEditingTitle(false)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await protocolApi.export(protocolId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${protocol.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleRevise = async () => {
    if (!revisionFeedback.trim()) return
    setRevising(true)
    setRevisionError('')
    try {
      await protocolApi.revise(protocolId, revisionFeedback.trim())
      setRevisionFeedback('')
      setShowRevisionPanel(false)
      await loadProtocol()
    } catch (err) {
      setRevisionError(err.message)
    } finally {
      setRevising(false)
    }
  }

  const handleBackToInput = async () => {
    await protocolApi.update(protocolId, { phase: 'input' })
    await loadProtocol()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-500">Loading protocol...</span>
      </div>
    )
  }

  if (error || !protocol) {
    return (
      <div className="p-6">
        <div className="text-red-600 bg-red-50 rounded-lg p-4">{error || 'Protocol not found'}</div>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-800 text-sm">
          &larr; Back
        </button>
      </div>
    )
  }

  // If in input phase, show the wizard
  if (protocol.phase === 'input') {
    return (
      <ProtocolWizard
        protocol={protocol}
        onGenerated={loadProtocol}
        onBack={onBack}
      />
    )
  }

  // Generated/review phase — show the editor
  const sections = protocol.sections || []
  const activeSection = sections.find((s) => s.id === activeSectionId)
  const completedCount = sections.filter((s) => s.status === 'complete').length
  const revisionsRemaining = protocol.revisions_remaining ?? 0

  const statusDot = (status) => {
    const colors = {
      not_started: 'bg-gray-300',
      in_progress: 'bg-yellow-400',
      complete: 'bg-green-500',
    }
    return colors[status] || colors.not_started
  }

  return (
    <div className="flex h-[calc(100vh-65px)]">
      {/* Left Sidebar — Section Navigation */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Protocol Info */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Protocols
          </button>

          {editingTitle ? (
            <input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              autoFocus
              className="w-full text-sm font-semibold border border-blue-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
              title="Click to edit title"
            >
              {protocol.title}
            </h2>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Generated
            </span>
            <span className="text-xs text-gray-400">
              {protocol.guideline}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{completedCount}/{sections.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${sections.length ? (completedCount / sections.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Section List */}
        <div className="flex-1 overflow-y-auto">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => setActiveSectionId(section.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors flex items-start gap-3 ${
                activeSectionId === section.id
                  ? 'bg-blue-50 border-l-2 border-l-blue-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${statusDot(section.status)}`} />
              <div className="min-w-0">
                <span className="text-xs text-gray-400">{index + 1}.</span>
                <span className="text-sm text-gray-700 ml-1 line-clamp-2">{section.section_title}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          {/* Revise with AI */}
          <button
            onClick={() => setShowRevisionPanel(!showRevisionPanel)}
            disabled={revisionsRemaining <= 0}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              revisionsRemaining > 0
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {revisionsRemaining > 0
              ? `Revise with AI (${revisionsRemaining} left)`
              : 'No revisions remaining'}
          </button>

          {/* Back to Input */}
          <button
            onClick={handleBackToInput}
            className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Input Phase
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exporting ? 'Exporting...' : 'Export as Word'}
          </button>
        </div>
      </div>

      {/* Right — Section Editor */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {/* Revision Panel */}
        {showRevisionPanel && (
          <div className="max-w-3xl mx-auto mb-6">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">
                Revise with AI ({revisionsRemaining} revision{revisionsRemaining !== 1 ? 's' : ''} remaining)
              </h3>
              <p className="text-xs text-purple-700 mb-3">
                Describe what changes you'd like across the protocol. The AI will revise all sections based on your feedback.
              </p>
              <textarea
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="e.g., Make the statistical methods section more detailed, add more about blinding procedures, expand the sample size justification..."
                className="w-full p-3 border border-purple-200 rounded-lg text-sm resize-none h-24 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              {revisionError && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded p-2">{revisionError}</div>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleRevise}
                  disabled={revising || !revisionFeedback.trim()}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                >
                  {revising ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Revising...
                    </span>
                  ) : 'Apply Revision'}
                </button>
                <button
                  onClick={() => { setShowRevisionPanel(false); setRevisionFeedback(''); setRevisionError('') }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection ? (
          <ProtocolSection
            key={activeSection.id}
            section={activeSection}
            protocolId={protocolId}
            onUpdate={handleUpdateSection}
          />
        ) : (
          <div className="text-center py-20 text-gray-500">
            Select a section from the sidebar to begin editing.
          </div>
        )}
      </div>

      {/* Revising overlay */}
      {revising && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-sm mx-4 text-center">
            <svg className="w-12 h-12 animate-spin mx-auto text-purple-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Revising Protocol</h3>
            <p className="text-sm text-gray-500">Applying your feedback to all sections...</p>
          </div>
        </div>
      )}
    </div>
  )
}
