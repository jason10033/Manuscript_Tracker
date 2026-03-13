import { useState } from 'react'
import { STATUS_MAP, VALID_TRANSITIONS } from '../lib/constants'

function daysAgo(dateStr) {
  if (!dateStr) return 0
  return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
}

export default function TableView({ manuscripts, onStatusChange, onSelect }) {
  const [sortKey, setSortKey] = useState('updated_at')
  const [sortDir, setSortDir] = useState('desc')
  const [filter, setFilter] = useState('')

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...manuscripts]
    .filter(m => {
      if (!filter) return true
      const q = filter.toLowerCase()
      return m.title.toLowerCase().includes(q) ||
        m.authors.toLowerCase().includes(q) ||
        m.contact_person.toLowerCase().includes(q) ||
        m.current_status.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      let av = a[sortKey] || ''
      let bv = b[sortKey] || ''
      if (sortKey === 'days') {
        av = daysAgo(a.updated_at)
        bv = daysAgo(b.updated_at)
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return null
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const lastJournal = (m) => {
    if (!m.events?.length) return ''
    for (let i = m.events.length - 1; i >= 0; i--) {
      if (m.events[i].journal) return m.events[i].journal
    }
    return ''
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter manuscripts..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg w-72 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  ['title', 'Title'],
                  ['authors', 'Authors'],
                  ['contact_person', 'Contact'],
                  ['current_status', 'Status'],
                  ['journal', 'Journal'],
                  ['days', 'Days in Stage'],
                  ['updated_at', 'Last Updated'],
                ].map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  >
                    {label}<SortIcon col={key} />
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(m => {
                const status = STATUS_MAP[m.current_status] || STATUS_MAP.IDEA
                const days = daysAgo(m.updated_at)
                const isStale = days >= 30 && !['ACCEPTED', 'REJECTED'].includes(m.current_status)
                const transitions = VALID_TRANSITIONS[m.current_status] || []

                return (
                  <tr
                    key={m.id}
                    onClick={() => onSelect(m)}
                    className={`cursor-pointer hover:bg-gray-50 ${isStale ? 'bg-amber-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                      {isStale && <span className="text-amber-500 mr-1">&#9888;</span>}
                      {m.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{m.authors}</td>
                    <td className="px-4 py-3 text-gray-600 truncate">{m.contact_person}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lastJournal(m)}</td>
                    <td className="px-4 py-3 text-gray-600">{days}d</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(m.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 flex-wrap">
                        {transitions.map(t => (
                          <button
                            key={t}
                            onClick={() => onStatusChange(m, t)}
                            className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                          >
                            &rarr; {STATUS_MAP[t].label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    {filter ? 'No manuscripts match your filter' : 'No manuscripts yet. Create one to get started!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
