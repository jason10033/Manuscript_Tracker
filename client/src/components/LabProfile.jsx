import { useState, useEffect } from 'react'
import { authApi } from '../lib/api'

export default function LabProfile({ onBack }) {
  const [settings, setSettings] = useState(null)
  const [members, setMembers] = useState([])
  const [form, setForm] = useState({})
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // New member form
  const [newMember, setNewMember] = useState({ name: '', role: '', email: '' })
  const [editingMember, setEditingMember] = useState(null)
  const [addingMember, setAddingMember] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [s, m] = await Promise.all([authApi.getSettings(), authApi.getMembers()])
    setSettings(s)
    setForm({
      lab_name: s.lab_name || '',
      pi_name: s.pi_name || '',
      institution: s.institution || '',
      department: s.department || '',
      website_url: s.website_url || '',
      stale_threshold_days: s.stale_threshold_days || 30,
    })
    setMembers(m)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage('')
    try {
      const updates = { ...form, stale_threshold_days: parseInt(form.stale_threshold_days) }
      if (password) updates.password = password
      const updated = await authApi.updateSettings(updates)
      setSettings(updated)
      if (updates.lab_name) localStorage.setItem('lab_name', updated.lab_name)
      setPassword('')
      setMessage('Profile saved!')
    } catch (err) {
      setMessage('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMember.name.trim()) return
    try {
      const member = await authApi.addMember(newMember)
      setMembers([...members, member])
      setNewMember({ name: '', role: '', email: '' })
      setAddingMember(false)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleUpdateMember = async (id) => {
    try {
      const updated = await authApi.updateMember(id, editingMember)
      setMembers(members.map(m => m.id === id ? updated : m))
      setEditingMember(null)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleDeleteMember = async (id) => {
    if (!confirm('Remove this member?')) return
    try {
      await authApi.deleteMember(id)
      setMembers(members.filter(m => m.id !== id))
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  if (!settings) {
    return <div className="p-8 text-center text-gray-500">Loading profile...</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your lab information and members</p>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          &larr; Back to Tracker
        </button>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lab Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab Name</label>
            <input
              type="text"
              value={form.lab_name}
              onChange={e => setForm({ ...form, lab_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Principal Investigator</label>
            <input
              type="text"
              value={form.pi_name}
              onChange={e => setForm({ ...form, pi_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., Dr. Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
            <input
              type="text"
              value={form.institution}
              onChange={e => setForm({ ...form, institution: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., MIT"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., Biology"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              value={form.website_url}
              onChange={e => setForm({ ...form, website_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="https://lab.university.edu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stale Threshold (days)</label>
            <input
              type="number"
              value={form.stale_threshold_days}
              onChange={e => setForm({ ...form, stale_threshold_days: e.target.value })}
              min={1}
              max={365}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Manuscripts idle this long get flagged</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Change Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Leave blank to keep current"
            className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {message && (
          <div className={`mt-4 text-sm p-3 rounded-lg ${message.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Lab Members */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Lab Members</h2>
          <button
            onClick={() => setAddingMember(true)}
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Member
          </button>
        </div>

        {addingMember && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Name *"
                value={newMember.name}
                onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder="Role (e.g., Postdoc)"
                value={newMember.role}
                onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={newMember.email}
                onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddMember} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
              <button onClick={() => { setAddingMember(false); setNewMember({ name: '', role: '', email: '' }) }} className="text-sm px-3 py-1.5 text-gray-600">Cancel</button>
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No members added yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="py-2 px-2 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map(m => (
                  <tr key={m.id}>
                    {editingMember?.id === m.id ? (
                      <>
                        <td className="py-2 px-2">
                          <input value={editingMember.name} onChange={e => setEditingMember({ ...editingMember, name: e.target.value })}
                            className="px-2 py-1 border rounded text-sm w-full" />
                        </td>
                        <td className="py-2 px-2">
                          <input value={editingMember.role} onChange={e => setEditingMember({ ...editingMember, role: e.target.value })}
                            className="px-2 py-1 border rounded text-sm w-full" />
                        </td>
                        <td className="py-2 px-2">
                          <input value={editingMember.email} onChange={e => setEditingMember({ ...editingMember, email: e.target.value })}
                            className="px-2 py-1 border rounded text-sm w-full" />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button onClick={() => handleUpdateMember(m.id)} className="text-blue-600 hover:text-blue-800 text-xs mr-2">Save</button>
                          <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-2 text-gray-900">{m.name}</td>
                        <td className="py-2 px-2 text-gray-600">{m.role}</td>
                        <td className="py-2 px-2 text-gray-600">{m.email}</td>
                        <td className="py-2 px-2 text-right">
                          <button onClick={() => setEditingMember({ ...m })} className="text-blue-600 hover:text-blue-800 text-xs mr-2">Edit</button>
                          <button onClick={() => handleDeleteMember(m.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
