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

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('lab_name')
    localStorage.removeItem('is_admin')
    window.location.reload()
    throw new Error('Session expired')
  }

  const data = await res.json()
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

// Admin
export const adminApi = {
  getLabs: () => fetchApi('/admin/labs'),
}
