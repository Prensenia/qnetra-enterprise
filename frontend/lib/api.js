const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('qnetra_token') : null)
export function setToken(t) { if (typeof window !== 'undefined') localStorage.setItem('qnetra_token', t) }
export function clearToken() { if (typeof window !== 'undefined') localStorage.removeItem('qnetra_token') }

// True only when the backend could not be reached at all (Vercel static demo,
// API host down, request aborted/timed out) — not for 4xx/5xx responses.
export function isBackendUnreachable(err) {
  if (!err) return false
  if (err.name === 'AbortError') return true
  if (err instanceof TypeError) return true
  return /failed to fetch|networkerror|network error|load failed|fetch failed|timed? ?out|aborted|econnrefused/i.test(String(err.message || err))
}

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

// ---------------------------------------------------------------------------
// Demo fallback data (used only when the backend is unreachable, e.g. on Vercel)
// Victim -> SBI UTR 420192830192 -> WazirX -> 0xA7F367e92d11b890 -> Bridge/Mixer
// ---------------------------------------------------------------------------

const DEMO_CHAIN = {
  nodes: [
    { id: 'victim_sbi_9812', type: 'Victim', label: 'Victim (SBI UPI)', risk_score: 5 },
    { id: 'SBI-9920182', type: 'Bank', label: 'SBI UTR 420192830192', risk_score: 40 },
    { id: '0xCEX_WazirX_Hot', type: 'Exchange', label: 'WazirX Deposit', risk_score: 65 },
    { id: '0xA7F367e92d11b890', type: 'CryptoWallet', label: 'Primary Mule Wallet', risk_score: 70 },
    { id: '0xBridge_Polygon_ETH', type: 'Bridge', label: 'Polygon → ETH Bridge', risk_score: 85 },
    { id: '0xMixer_Tornado_Pool', type: 'Mixer', label: 'Mixer (Tornado-style)', risk_score: 95 },
  ],
  edges: [
    { id: 'demo-e1', source: 'victim_sbi_9812', target: 'SBI-9920182', amount: 470000, asset: 'INR', token: 'INR', tx_hash: '0xabc1', timestamp: '2026-09-08T10:31:04+05:30' },
    { id: 'demo-e2', source: 'SBI-9920182', target: '0xCEX_WazirX_Hot', amount: 470000, asset: 'INR', token: 'INR', tx_hash: '0xabc2', timestamp: '2026-09-08T10:32:00+05:30' },
    { id: 'demo-e3', source: '0xCEX_WazirX_Hot', target: '0xA7F367e92d11b890', amount: 5200, asset: 'USDT', token: 'USDT', tx_hash: '0xabc3', timestamp: '2026-09-08T10:33:00+05:30' },
    { id: 'demo-e4', source: '0xA7F367e92d11b890', target: '0xBridge_Polygon_ETH', amount: 2000, asset: 'USDT', token: 'USDT', tx_hash: '0xabc4', timestamp: '2026-09-08T10:34:00+05:30' },
    { id: 'demo-e5', source: '0xA7F367e92d11b890', target: '0xMixer_Tornado_Pool', amount: 3200, asset: 'USDT', token: 'USDT', tx_hash: '0xabc5', timestamp: '2026-09-08T10:35:00+05:30' },
  ],
}

const LEGAL_DISCLAIMER =
  'This is an analytical lead, not a final finding of guilt. Output generated requires independent verification under Section 94 BNSS 2023.'

const DEMO_SHA_A = '9f2c4b1e7a83d6504b1e9f2c7a83d6504b1e9f2c7a83d6504b1e9f2c7a83d650'
const DEMO_SHA_B = 'c4a7e19d3b8265f0c4a7e19d3b8265f0c4a7e19d3b8265f0c4a7e19d3b8265f0'

function demoHops(walletId) {
  const nodes = [...DEMO_CHAIN.nodes]
  if (walletId && !nodes.some(n => n.id === walletId)) {
    nodes.push({ id: walletId, type: 'CryptoWallet', label: walletId, risk_score: 70 })
    return {
      nodes,
      edges: [
        ...DEMO_CHAIN.edges,
        { id: 'demo-e6', source: '0xMixer_Tornado_Pool', target: walletId, amount: 1200, asset: 'USDT', token: 'USDT', tx_hash: '0xabc6', timestamp: '2026-09-08T10:36:00+05:30' },
      ],
      source: 'demo_fallback',
    }
  }
  return { nodes, edges: [...DEMO_CHAIN.edges], source: 'demo_fallback' }
}

function demoRisk(walletId) {
  return {
    wallet_address: walletId,
    overall_score: 70,
    risk_level: 'CRITICAL',
    score_breakdown: { mixer_exposure: 20, scam_cluster_proximity: 20, bridge_traversal: 15, rapid_fanout: 15 },
    risk_reasons: [
      { rule: 'Mixer Exposure', description: 'Direct interaction with known mixer contract', score: 20 },
      { rule: 'Scam Cluster Proximity', description: 'Proximity to flagged scam wallet cluster', score: 20 },
      { rule: 'Bridge Traversal', description: 'Cross-chain bridge traversal detected', score: 15 },
      { rule: 'Rapid Fan-Out', description: 'More than 5 downstream transfers within 60 seconds', score: 15 },
    ],
    source: 'demo_fallback',
    legal_disclaimer: LEGAL_DISCLAIMER,
  }
}

function demoDilution(payload) {
  // Taint decays 60% -> 12% along the Victim -> SBI -> WazirX -> mule wallet chain.
  const schedule = [0.3, 0.18, 0.12]
  const hops = payload?.hops?.length
    ? payload.hops
    : [
        { wallet_address: 'SBI-9920182', pre_balance: 1000, received_amount: 500 },
        { wallet_address: '0xCEX_WazirX_Hot', pre_balance: 1200, received_amount: 5200 },
        { wallet_address: '0xA7F367e92d11b890', pre_balance: 4000, received_amount: 5200 },
      ]
  const steps = hops.map((h, i) => ({
    wallet_address: h.wallet_address,
    pre_balance: h.pre_balance ?? 1000,
    received_amount: h.received_amount ?? 500,
    new_ratio: schedule[Math.min(i, schedule.length - 1)],
  }))
  return {
    initial_taint_ratio: 0.6,
    steps,
    final_ratio: steps.length ? steps[steps.length - 1].new_ratio : 0.6,
    source: 'demo_fallback',
    legal_disclaimer: LEGAL_DISCLAIMER,
  }
}

function demoAuditTrail(caseId) {
  const entries = [
    {
      action: 'CASE_OPENED',
      actor_id: 'admin@cybernautics.in',
      timestamp_ist: '2026-03-15T10:00:00+05:30',
      sha256: DEMO_SHA_A,
      client_sha256: DEMO_SHA_A,
      server_sha256: DEMO_SHA_A,
      ip: '10.24.6.11',
    },
    {
      action: 'EVIDENCE_UPLOAD',
      actor_id: 'victim.demo@citizen.in',
      timestamp_ist: '2026-03-15T10:04:12+05:30',
      sha256: DEMO_SHA_B,
      client_sha256: DEMO_SHA_B,
      server_sha256: DEMO_SHA_B,
      filename: 'sbi_statement_420192830192.csv',
      ip: '10.24.6.42',
    },
  ]
  return { case_id: caseId, entries, source: 'demo_fallback' }
}

export async function fetchWalletHops(walletId) {
  try {
    return await api(`/api/hops/${walletId}`)
  } catch (err) {
    if (!isBackendUnreachable(err)) throw err
    return demoHops(walletId)
  }
}

export async function fetchWalletRisk(walletId) {
  try {
    return await api(`/api/risk/${walletId}`)
  } catch (err) {
    if (!isBackendUnreachable(err)) throw err
    return demoRisk(walletId)
  }
}

export async function calculateDilution(payload) {
  try {
    return await api('/api/dilution/calculate', { method: 'POST', body: JSON.stringify(payload) })
  } catch (err) {
    if (!isBackendUnreachable(err)) throw err
    return demoDilution(payload)
  }
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
  try {
    return await api(`/api/cases/${caseId}/audit-trail`)
  } catch (err) {
    if (!isBackendUnreachable(err)) throw err
    return demoAuditTrail(caseId)
  }
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
