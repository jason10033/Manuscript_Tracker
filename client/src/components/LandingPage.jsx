import { useState } from 'react'
import { authApi } from '../lib/api'

const TOOLS = [
  {
    name: 'Manuscript Tracker',
    description: 'Track your publication pipeline from idea to acceptance',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    active: true,
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:shadow-lg',
    iconColor: 'text-blue-600',
  },
  {
    name: 'Lab Inventory',
    description: 'Manage reagents, equipment, and supplies',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    active: false,
    color: 'bg-gray-50 border-gray-200',
    iconColor: 'text-gray-400',
  },
  {
    name: 'Protocol Manager',
    description: 'Document and share lab protocols',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    active: false,
    color: 'bg-gray-50 border-gray-200',
    iconColor: 'text-gray-400',
  },
  {
    name: 'Data Notebook',
    description: 'Electronic lab notebook for experiments',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    active: false,
    color: 'bg-gray-50 border-gray-200',
    iconColor: 'text-gray-400',
  },
]

export default function LandingPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [isAdminRegister, setIsAdminRegister] = useState(false)
  const [labName, setLabName] = useState('')
  const [password, setPassword] = useState('')
  const [adminSecret, setAdminSecret] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check for existing session
  const existingToken = localStorage.getItem('token')
  const existingLabName = localStorage.getItem('lab_name')
  const existingIsAdmin = localStorage.getItem('is_admin') === '1'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let data
      if (isAdminRegister) {
        data = await authApi.registerAdmin(labName, password, adminSecret)
      } else if (isRegister) {
        data = await authApi.register(labName, password)
      } else {
        data = await authApi.login(labName, password)
      }
      onLogin(data.token, data.lab_name, !!data.is_admin)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenTracker = () => {
    if (existingToken && existingLabName) {
      onLogin(existingToken, existingLabName, existingIsAdmin)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="pt-12 pb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ResearchLabTools</h1>
        <p className="text-lg text-gray-500">Everything your lab needs, in one place</p>
        {existingToken && existingLabName && (
          <p className="mt-3 text-sm text-blue-600">
            Welcome back, <strong>{existingLabName}</strong>
          </p>
        )}
      </header>

      {/* Tool Grid */}
      <div className="max-w-3xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map((tool) => (
            <div
              key={tool.name}
              onClick={tool.active ? (existingToken ? handleOpenTracker : undefined) : undefined}
              className={`relative rounded-xl border-2 p-6 transition-all ${tool.color} ${
                tool.active ? 'cursor-pointer' : 'cursor-default opacity-70'
              }`}
            >
              {!tool.active && (
                <span className="absolute top-3 right-3 text-xs font-medium bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              )}
              <div className={`mb-3 ${tool.iconColor}`}>{tool.icon}</div>
              <h3 className={`font-semibold text-lg mb-1 ${tool.active ? 'text-gray-900' : 'text-gray-500'}`}>
                {tool.name}
              </h3>
              <p className={`text-sm ${tool.active ? 'text-gray-600' : 'text-gray-400'}`}>
                {tool.description}
              </p>
              {tool.active && existingToken && (
                <div className="mt-3">
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    Open Tracker &rarr;
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Login / Register Form */}
      {!existingToken && (
        <div className="max-w-md mx-auto px-4 pb-16">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-1 text-center">
              {isAdminRegister ? 'Admin Registration' : isRegister ? 'Register Your Lab' : 'Lab Login'}
            </h2>
            <p className="text-sm text-gray-500 mb-6 text-center">
              {isAdminRegister
                ? 'Create an admin account'
                : isRegister
                ? 'Create an account to start tracking'
                : 'Sign in to access your tools'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isAdminRegister ? 'Admin Name' : 'Lab Name'}
                </label>
                <input
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={isAdminRegister ? 'e.g., Admin' : 'e.g., Smith Lab'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter password"
                  required
                  minLength={4}
                />
              </div>

              {isAdminRegister && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Secret</label>
                  <input
                    type="password"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter admin secret key"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading
                  ? 'Please wait...'
                  : isAdminRegister
                  ? 'Register Admin'
                  : isRegister
                  ? 'Register Lab'
                  : 'Log In'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              {!isAdminRegister && (
                <button
                  onClick={() => { setIsRegister(!isRegister); setError('') }}
                  className="text-blue-600 hover:text-blue-800 text-sm block w-full"
                >
                  {isRegister ? 'Already have an account? Log in' : 'New lab? Register here'}
                </button>
              )}
              <button
                onClick={() => { setIsAdminRegister(!isAdminRegister); setIsRegister(false); setError('') }}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                {isAdminRegister ? 'Back to lab login' : 'Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
