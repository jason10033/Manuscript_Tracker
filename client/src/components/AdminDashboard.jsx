import { useState, useEffect } from 'react'
import { adminApi } from '../lib/api'

export default function AdminDashboard({ onBack }) {
  const [labs, setLabs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getLabs().then(data => {
      setLabs(data)
      setLoading(false)
    }).catch(err => {
      console.error('Failed to load admin data:', err)
      setLoading(false)
    })
  }, [])

  const totals = labs.reduce((acc, lab) => ({
    manuscripts: acc.manuscripts + (lab.manuscript_count || 0),
    idea: acc.idea + (lab.idea_count || 0),
    draft: acc.draft + (lab.draft_count || 0),
    circulated: acc.circulated + (lab.circulated_count || 0),
    submitted: acc.submitted + (lab.submitted_count || 0),
    rr: acc.rr + (lab.rr_count || 0),
    rejected: acc.rejected + (lab.rejected_count || 0),
    accepted: acc.accepted + (lab.accepted_count || 0),
    members: acc.members + (lab.member_count || 0),
  }), { manuscripts: 0, idea: 0, draft: 0, circulated: 0, submitted: 0, rr: 0, rejected: 0, accepted: 0, members: 0 })

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of all registered labs</p>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          &larr; Back to Tracker
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{labs.length}</div>
          <div className="text-sm text-gray-500">Total Labs</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{totals.manuscripts}</div>
          <div className="text-sm text-gray-500">Total Manuscripts</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{totals.accepted}</div>
          <div className="text-sm text-gray-500">Accepted</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{totals.members}</div>
          <div className="text-sm text-gray-500">Total Members</div>
        </div>
      </div>

      {/* Labs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading labs...</div>
        ) : labs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No labs registered yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lab Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PI</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institution</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Members</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase" title="Idea">Idea</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-blue-500 uppercase" title="Draft">Draft</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-indigo-500 uppercase" title="Circulated">Circ</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-yellow-600 uppercase" title="Submitted">Sub</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase" title="Revise & Resubmit">R&R</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-red-500 uppercase" title="Rejected">Rej</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-green-600 uppercase" title="Accepted">Acc</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {labs.map(lab => (
                  <tr key={lab.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{lab.lab_name}</td>
                    <td className="px-4 py-3 text-gray-600">{lab.pi_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{lab.institution || '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{lab.member_count || 0}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{lab.manuscript_count || 0}</td>
                    <td className="px-3 py-3 text-center text-gray-500">{lab.idea_count || 0}</td>
                    <td className="px-3 py-3 text-center text-blue-600">{lab.draft_count || 0}</td>
                    <td className="px-3 py-3 text-center text-indigo-600">{lab.circulated_count || 0}</td>
                    <td className="px-3 py-3 text-center text-yellow-600">{lab.submitted_count || 0}</td>
                    <td className="px-3 py-3 text-center text-orange-600">{lab.rr_count || 0}</td>
                    <td className="px-3 py-3 text-center text-red-600">{lab.rejected_count || 0}</td>
                    <td className="px-3 py-3 text-center text-green-600">{lab.accepted_count || 0}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {lab.created_at ? new Date(lab.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {lab.last_activity ? new Date(lab.last_activity).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                  <td className="px-4 py-3 text-gray-900">Totals</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-center text-gray-900">{totals.members}</td>
                  <td className="px-4 py-3 text-center text-gray-900">{totals.manuscripts}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{totals.idea}</td>
                  <td className="px-3 py-3 text-center text-blue-600">{totals.draft}</td>
                  <td className="px-3 py-3 text-center text-indigo-600">{totals.circulated}</td>
                  <td className="px-3 py-3 text-center text-yellow-600">{totals.submitted}</td>
                  <td className="px-3 py-3 text-center text-orange-600">{totals.rr}</td>
                  <td className="px-3 py-3 text-center text-red-600">{totals.rejected}</td>
                  <td className="px-3 py-3 text-center text-green-600">{totals.accepted}</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
