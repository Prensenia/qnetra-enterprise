const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function api(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('qnetra_token') : null
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  const res = await fetch(`${API}${path}`, { headers, ...options })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function setToken(t) { if (typeof window !== 'undefined') localStorage.setItem('qnetra_token', t) }
export function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('qnetra_token') : null }
export function clearToken() { if (typeof window !== 'undefined') localStorage.removeItem('qnetra_token') }
