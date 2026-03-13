import { useState, useEffect, useCallback } from 'react'
import LoginPage from './components/LoginPage'
import Header from './components/Header'
import DashboardStats from './components/DashboardStats'
import KanbanBoard from './components/KanbanBoard'
import TableView from './components/TableView'
import ManuscriptDetail from './components/ManuscriptDetail'
import StatusChangeModal from './components/StatusChangeModal'
import NewManuscriptModal from './components/NewManuscriptModal'
import SettingsModal from './components/SettingsModal'
import { manuscriptApi } from './lib/api'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [labName, setLabName] = useState(localStorage.getItem('lab_name') || '')
  const [manuscripts, setManuscripts] = useState([])
  const [view, setView] = useState('kanban')
  const [selectedManuscript, setSelectedManuscript] = useState(null)
  const [statusChangeData, setStatusChangeData] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = (tokenVal, labNameVal) => {
    localStorage.setItem('token', tokenVal)
    localStorage.setItem('lab_name', labNameVal)
    setToken(tokenVal)
    setLabName(labNameVal)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('lab_name')
    setToken(null)
    setLabName('')
  }

  const loadManuscripts = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await manuscriptApi.list()
      setManuscripts(data)
    } catch (err) {
      console.error('Failed to load manuscripts:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadManuscripts()
  }, [loadManuscripts])

  const handleStatusChange = (manuscript, newStatus) => {
    setStatusChangeData({ manuscript, newStatus })
  }

  const handleStatusChangeComplete = async (eventData) => {
    try {
      await manuscriptApi.addEvent(statusChangeData.manuscript.id, {
        status: statusChangeData.newStatus,
        ...eventData,
      })
      setStatusChangeData(null)
      await loadManuscripts()
      if (selectedManuscript?.id === statusChangeData.manuscript.id) {
        const updated = await manuscriptApi.get(statusChangeData.manuscript.id)
        setSelectedManuscript(updated)
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message)
    }
  }

  const handleCreateManuscript = async (data) => {
    try {
      await manuscriptApi.create(data)
      setShowNewModal(false)
      await loadManuscripts()
    } catch (err) {
      alert('Failed to create manuscript: ' + err.message)
    }
  }

  const handleDeleteManuscript = async (id) => {
    if (!confirm('Are you sure you want to delete this manuscript?')) return
    try {
      await manuscriptApi.delete(id)
      setSelectedManuscript(null)
      await loadManuscripts()
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  const handleUpdateManuscript = async (id, data) => {
    try {
      await manuscriptApi.update(id, data)
      await loadManuscripts()
      const updated = await manuscriptApi.get(id)
      setSelectedManuscript(updated)
    } catch (err) {
      alert('Failed to update: ' + err.message)
    }
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        labName={labName}
        view={view}
        onViewChange={setView}
        onNewManuscript={() => setShowNewModal(true)}
        onLogout={handleLogout}
        onSettings={() => setShowSettings(true)}
      />

      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <DashboardStats manuscripts={manuscripts} />

        {loading && manuscripts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Loading manuscripts...</div>
        ) : view === 'kanban' ? (
          <KanbanBoard
            manuscripts={manuscripts}
            onStatusChange={handleStatusChange}
            onSelect={setSelectedManuscript}
          />
        ) : (
          <TableView
            manuscripts={manuscripts}
            onStatusChange={handleStatusChange}
            onSelect={setSelectedManuscript}
          />
        )}
      </main>

      {selectedManuscript && (
        <ManuscriptDetail
          manuscript={selectedManuscript}
          onClose={() => setSelectedManuscript(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteManuscript}
          onUpdate={handleUpdateManuscript}
        />
      )}

      {statusChangeData && (
        <StatusChangeModal
          manuscript={statusChangeData.manuscript}
          newStatus={statusChangeData.newStatus}
          onSubmit={handleStatusChangeComplete}
          onClose={() => setStatusChangeData(null)}
        />
      )}

      {showNewModal && (
        <NewManuscriptModal
          onSubmit={handleCreateManuscript}
          onClose={() => setShowNewModal(false)}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
