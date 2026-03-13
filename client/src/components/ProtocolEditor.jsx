import { useState, useEffect } from 'react'
import { protocolApi } from '../lib/api'
import ProtocolSection from './ProtocolSection'

export default function ProtocolEditor({ protocolId, onBack }) {
  const [protocol, setProtocol] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

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

  const handleGenerateSection = async (sectionId, additionalContext) => {
    const result = await protocolApi.generateSection(protocolId, sectionId, { additionalContext })
    return result
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

  const sections = protocol.sections || []
  const activeSection = sections.find((s) => s.id === activeSectionId)
  const completedCount = sections.filter((s) => s.status === 'complete').length

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
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {protocol.typeLabel}
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

        {/* Export Button */}
        <div className="p-4 border-t border-gray-200">
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
        {activeSection ? (
          <ProtocolSection
            key={activeSection.id}
            section={activeSection}
            protocolId={protocolId}
            onUpdate={handleUpdateSection}
            onGenerate={handleGenerateSection}
          />
        ) : (
          <div className="text-center py-20 text-gray-500">
            Select a section from the sidebar to begin editing.
          </div>
        )}
      </div>
    </div>
  )
}
