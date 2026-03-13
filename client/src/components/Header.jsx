export default function Header({ labName, page, view, onViewChange, onNewManuscript, onLogout, onLabProfile, onAdminDashboard, onProtocolGenerator, onHome, isAdmin }) {
  const isTracker = page === 'tracker'
  const isProtocol = page === 'protocol-generator'

  const pageTitle = isProtocol ? 'Protocol Generator' : 'Manuscript Tracker'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{labName}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Manuscript-specific controls only shown on tracker page */}
          {isTracker && (
            <>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onViewChange('kanban')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    view === 'kanban' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Board
                </button>
                <button
                  onClick={() => onViewChange('table')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    view === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Table
                </button>
              </div>

              <button
                onClick={onNewManuscript}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + New Manuscript
              </button>
            </>
          )}

          {/* Tool switcher buttons */}
          {!isTracker && (
            <button
              onClick={onHome}
              className="text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
            >
              Manuscripts
            </button>
          )}
          {!isProtocol && (
            <button
              onClick={onProtocolGenerator}
              className="text-sm px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium"
            >
              Protocols
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onAdminDashboard}
              className="text-sm px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
            >
              Admin
            </button>
          )}

          <button
            onClick={onLabProfile}
            className="text-gray-500 hover:text-gray-700 p-2"
            title="Lab Profile"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <button
            onClick={onLogout}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
