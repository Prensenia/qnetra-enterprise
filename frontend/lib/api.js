const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('qnetra_token') : null)
export function setToken(t) { if (typeof window !== 'undefined') localStorage.setItem('qnetra_token', t) }
export function clearToken() { if (typeof window !== 'undefined') localStorage.removeItem('qnetra_token') }

import { mockHandle } from './mockEngine'

async function tryFetch(path, options) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 2500)
  try {
    const token = getToken()
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
    const res = await fetch(`${API}${path}`, { ...options, headers, signal: controller.signal })
    clearTimeout(id)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (e) {
    clearTimeout(id)
    throw e
  }
}

export async function api(path, options = {}) {
  try {
    return await tryFetch(path, options)
  } catch (e) {
    // fallback to mock engine
    return mockHandle(path, options)
  }
}

export async function apiUpload(path, formData) {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 2500)
    const token = getToken()
    const res = await fetch(`${API}${path}`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData, signal: controller.signal })
    clearTimeout(id)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (e) {
    // mock fallback: read first file
    const file = formData.get('file')
    let text = ''
    if (file) text = await file.text()
    return mockHandle(path, { method: 'POST', body: JSON.stringify({ filename: file?.name, content: text, case_id: formData.get('case_id') }) })
  }
}
