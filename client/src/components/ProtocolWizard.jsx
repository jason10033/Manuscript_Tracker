import { useState, useEffect, useRef } from 'react'
import { protocolApi } from '../lib/api'

export default function ProtocolWizard({ protocol, onGenerated, onBack }) {
  const sections = protocol.sections || []
  const [currentStep, setCurrentStep] = useState(0)
  const [notes, setNotes] = useState({})
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const saveTimerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Initialize notes from existing section data
  useEffect(() => {
    const existing = {}
    for (const s of sections) {
      existing[s.id] = s.user_notes || ''
    }
    setNotes(existing)
  }, [protocol.id])

  const currentSection = sections[currentStep]
  const filledCount = Object.values(notes).filter(n => n && n.trim()).length

  const saveNotes = async (sectionId, value) => {
    setSaving(true)
    try {
      await protocolApi.updateSection(protocol.id, sectionId, { user_notes: value })
    } catch (err) {
      // Silent save failure — will retry on next change
    } finally {
      setSaving(false)
    }
  }

  const handleNotesChange = (e) => {
    const value = e.target.value
    const sectionId = currentSection.id
    setNotes(prev => ({ ...prev, [sectionId]: value }))

    // Debounced save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveNotes(sectionId, value)
    }, 2000)
  }

  const handleBlurSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveNotes(currentSection.id, notes[currentSection.id] || '')
  }

  const goNext = () => {
    handleBlurSave()
    if (currentStep < sections.length - 1) setCurrentStep(currentStep + 1)
  }

  const goPrev = () => {
    handleBlurSave()
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const goToStep = (index) => {
    handleBlurSave()
    setCurrentStep(index)
  }

  const handleGenerate = async () => {
    handleBlurSave()
    setGenerating(true)
    setError('')
    try {
      await protocolApi.generateFull(protocol.id)
      onGenerated()
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    setError('')
    try {
      const result = await protocolApi.importDoc(protocol.id, file)
      // Refresh notes from imported data
      if (result.sections) {
        const imported = {}
        for (const s of result.sections) {
          imported[s.id] = s.user_notes || ''
        }
        setNotes(imported)
      }
      setError('')
    } catch (err) {
      setError('Import failed: ' + err.message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!currentSection) return null

  return (
    <div className="flex h-[calc(100vh-65px)]">
      {/* Left Sidebar — Step Navigation */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
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

          <h2 className="text-sm font-semibold text-gray-900">{protocol.title}</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Input Phase
            </span>
            <span className="text-xs text-gray-400">{protocol.guideline}</span>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Notes filled</span>
              <span>{filledCount}/{sections.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all"
                style={{ width: `${sections.length ? (filledCount / sections.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step List */}
        <div className="flex-1 overflow-y-auto">
          {sections.map((section, index) => {
            const hasNotes = notes[section.id] && notes[section.id].trim()
            return (
              <button
                key={section.id}
                onClick={() => goToStep(index)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors flex items-start gap-3 ${
                  currentStep === index
                    ? 'bg-amber-50 border-l-2 border-l-amber-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${hasNotes ? 'bg-amber-500' : 'bg-gray-300'}`} />
                <div className="min-w-0">
                  <span className="text-xs text-gray-400">{index + 1}.</span>
                  <span className="text-sm text-gray-700 ml-1 line-clamp-2">{section.section_title}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handleGenerate}
            disabled={generating || filledCount === 0}
            className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Protocol...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Protocol ({filledCount}/{sections.length})
              </>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import from .docx'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Right — Wizard Step Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          {/* Step indicator */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">
              Step {currentStep + 1} of {sections.length}
            </span>
            {saving && <span className="text-xs text-gray-400">Saving...</span>}
          </div>

          {/* Section Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{currentSection.section_title}</h3>
            </div>

            {/* Guideline — always visible */}
            <div className="px-5 pt-4">
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-100">
                <strong>Guideline:</strong> {currentSection.guideline_text}
              </div>
            </div>

            {/* Notes input */}
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your notes for this section
              </label>
              <textarea
                value={notes[currentSection.id] || ''}
                onChange={handleNotesChange}
                onBlur={handleBlurSave}
                placeholder="Describe your study's specifics for this section... (e.g., your study population, methods, specific details about your research)"
                className="w-full min-h-[200px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm leading-relaxed resize-none"
              />

              {error && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
              )}

              {/* Navigation */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30"
                >
                  Previous
                </button>

                <div className="flex gap-2">
                  {currentStep < sections.length - 1 ? (
                    <>
                      <button
                        onClick={goNext}
                        className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Skip
                      </button>
                      <button
                        onClick={goNext}
                        className="px-5 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                      >
                        Next
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleGenerate}
                      disabled={generating || filledCount === 0}
                      className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {generating ? 'Generating...' : `Generate Protocol (${filledCount}/${sections.length})`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-sm mx-4 text-center">
            <svg className="w-12 h-12 animate-spin mx-auto text-emerald-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Your Protocol</h3>
            <p className="text-sm text-gray-500">This may take up to a minute. Please don't close this page.</p>
          </div>
        </div>
      )}
    </div>
  )
}
