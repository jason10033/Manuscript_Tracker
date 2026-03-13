import { useState, useEffect } from 'react'
import { protocolApi } from '../lib/api'
import ProtocolTypeSelector from './ProtocolTypeSelector'
import ProtocolEditor from './ProtocolEditor'

export default function ProtocolGenerator({ onBack }) {
  const [protocols, setProtocols] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [selectedProtocolId, setSelectedProtocolId] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadProtocols()
  }, [])

  const loadProtocols = async () => {
    setLoading(true)
    try {
      const data = await protocolApi.list()
      setProtocols(data)
    } catch (err) {
      console.error('Failed to load protocols:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProtocol = async (protocolType) => {
    setCreating(true)
    try {
      const data = await protocolApi.create({
        title: 'Untitled Protocol',
        protocol_type: protocolType,
      })
      setShowTypeSelector(false)
      setSelectedProtocolId(data.id)
      await loadProtocols()
    } catch (err) {
      alert('Failed to create protocol: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProtocol = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this protocol? This cannot be undone.')) return
    try {
      await protocolApi.delete(id)
      if (selectedProtocolId === id) setSelectedProtocolId(null)
      await loadProtocols()
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  // If editing a protocol, show the editor
  if (selectedProtocolId) {
    return (
      <ProtocolEditor
        protocolId={selectedProtocolId}
        onBack={() => {
          setSelectedProtocolId(null)
          loadProtocols()
        }}
      />
    )
  }

  // Protocol list view
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Protocol Generator</h2>
          <p className="text-gray-500 mt-1">Create research protocols guided by EQUATOR reporting guidelines</p>
        </div>
        <button
          onClick={() => setShowTypeSelector(true)}
          disabled={creating}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          + New Protocol
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading protocols...</div>
      ) : protocols.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No protocols yet</h3>
          <p className="text-gray-400 mb-6">Create your first protocol to get started</p>
          <button
            onClick={() => setShowTypeSelector(true)}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            + New Protocol
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {protocols.map((protocol) => {
            const progress = protocol.totalSections
              ? Math.round((protocol.completedSections / protocol.totalSections) * 100)
              : 0

            return (
              <div
                key={protocol.id}
                onClick={() => setSelectedProtocolId(protocol.id)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{protocol.title}</h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {protocol.typeLabel}
                      </span>
                      <span className="text-xs text-gray-400">{protocol.guideline}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteProtocol(protocol.id, e)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                    title="Delete protocol"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{protocol.completedSections}/{protocol.totalSections} sections</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  Last updated: {new Date(protocol.updated_at).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showTypeSelector && (
        <ProtocolTypeSelector
          onSelect={handleCreateProtocol}
          onCancel={() => setShowTypeSelector(false)}
        />
      )}
    </div>
  )
}
