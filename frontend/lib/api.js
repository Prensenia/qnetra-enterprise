const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('qnetra_token') : null)
export function setToken(t) { if (typeof window !== 'undefined') localStorage.setItem('qnetra_token', t) }
export function clearToken() { if (typeof window !== 'undefined') localStorage.removeItem('qnetra_token') }

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
  return tryFetch(path, options)
}

export async function fetchWalletHops(walletId) {
  return api(`/api/hops/${walletId}`)
}
export async function fetchWalletRisk(walletId) {
  return api(`/api/risk/${walletId}`)
}
export async function calculateDilution(payload) {
  return api('/api/dilution/calculate', { method: 'POST', body: JSON.stringify(payload) })
}
export async function uploadCitizenEvidence(caseId, formData) {
  return apiUpload(`/api/citizen/cases/${caseId}/evidence`, formData)
}
export async function downloadSec63Dossier(payload, isDemoMode) {
  if (isDemoMode) {
    const pdf = '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF'
    const blob = new Blob([pdf], { type: 'application/pdf' })
    return { blob, filename: 'sample_dossier.pdf' }
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/report/sec63-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const blob = await res.blob()
  return { blob, filename: 'dossier.pdf' }
}

export async function fetchCaseAuditTrail(caseId) {
  return api(`/api/cases/${caseId}/audit-trail`)
}

export async function apiUpload(path, formData) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 2500)
  try {
    const token = getToken()
    const res = await fetch(`${API}${path}`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData, signal: controller.signal })
    clearTimeout(id)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  } catch (e) {
    clearTimeout(id)
    throw e
  }
}
