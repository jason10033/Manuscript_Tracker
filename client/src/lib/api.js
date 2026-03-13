const API_BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function fetchApi(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json()

  if (res.status === 401) {
    // Don't clear session for login/register attempts — just show the error
    const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/register')
    if (!isAuthRoute) {
      localStorage.removeItem('token')
      localStorage.removeItem('lab_name')
      localStorage.removeItem('is_admin')
      window.location.reload()
    }
    throw new Error(data.error || 'Session expired')
  }

  if (!res.ok) {
    throw new Error(data.error || 'API error')
  }
  return data
}

// Auth
export const authApi = {
  register: (lab_name, password) =>
    fetchApi('/auth/register', { method: 'POST', body: JSON.stringify({ lab_name, password }) }),
  registerAdmin: (lab_name, password, admin_secret) =>
    fetchApi('/auth/register-admin', { method: 'POST', body: JSON.stringify({ lab_name, password, admin_secret }) }),
  login: (lab_name, password) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ lab_name, password }) }),
  getSettings: () => fetchApi('/auth/settings'),
  updateSettings: (data) =>
    fetchApi('/auth/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getMembers: () => fetchApi('/auth/members'),
  addMember: (data) =>
    fetchApi('/auth/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id, data) =>
    fetchApi(`/auth/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMember: (id) =>
    fetchApi(`/auth/members/${id}`, { method: 'DELETE' }),
}

// Manuscripts
export const manuscriptApi = {
  list: () => fetchApi('/manuscripts'),
  get: (id) => fetchApi(`/manuscripts/${id}`),
  create: (data) =>
    fetchApi('/manuscripts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchApi(`/manuscripts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    fetchApi(`/manuscripts/${id}`, { method: 'DELETE' }),
  addEvent: (id, data) =>
    fetchApi(`/manuscripts/${id}/events`, { method: 'POST', body: JSON.stringify(data) }),
  stats: () => fetchApi('/manuscripts/stats/summary'),
}

// Protocols
export const protocolApi = {
  list: () => fetchApi('/protocols'),
  get: (id) => fetchApi(`/protocols/${id}`),
  create: (data) =>
    fetchApi('/protocols', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchApi(`/protocols/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    fetchApi(`/protocols/${id}`, { method: 'DELETE' }),
  updateSection: (protocolId, sectionId, data) =>
    fetchApi(`/protocols/${protocolId}/sections/${sectionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  generateFull: (protocolId) =>
    fetchApi(`/protocols/${protocolId}/generate`, { method: 'POST' }),
  revise: (protocolId, feedback) =>
    fetchApi(`/protocols/${protocolId}/revise`, { method: 'POST', body: JSON.stringify({ feedback }) }),
  importDoc: (protocolId, file) => {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${API_BASE}/protocols/${protocolId}/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      return data
    })
  },
  getTypes: () => fetchApi('/protocols/types/list'),
  export: (id) => {
    const token = getToken()
    return fetch(`${API_BASE}/protocols/${id}/export`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) throw new Error('Export failed')
      return res.blob()
    })
  },
}

// Admin
export const adminApi = {
  getLabs: () => fetchApi('/admin/labs'),
}
