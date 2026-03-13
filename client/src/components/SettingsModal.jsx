import { useState, useEffect } from 'react'
import { authApi } from '../lib/api'

export default function SettingsModal({ onClose }) {
  const [settings, setSettings] = useState(null)
  const [threshold, setThreshold] = useState(30)
  const [labName, setLabName] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    authApi.getSettings().then(data => {
      setSettings(data)
      setThreshold(data.stale_threshold_days)
      setLabName(data.lab_name)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const updates = { stale_threshold_days: parseInt(threshold) }
      if (labName !== settings.lab_name) updates.lab_name = labName
      if (password) updates.password = password

      const updated = await authApi.updateSettings(updates)
      setSettings(updated)
      if (updates.lab_name) {
        localStorage.setItem('lab_name', updated.lab_name)
      }
      setMessage('Settings saved!')
      setPassword('')
    } catch (err) {
      setMessage('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lab Settings</h2>

          {!settings ? (
            <div className="text-gray-500 py-4">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lab Name</label>
                <input
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stale Manuscript Threshold (days)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Manuscripts inactive for this many days will be flagged with a warning.
                </p>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  min={1}
                  max={365}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Change Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {message && (
                <div className={`text-sm p-2 rounded-lg ${message.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {message}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
