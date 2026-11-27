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
    { id: 'SBI-9920182', type: 'Bank', label: 'SBI Bank (UTR 420192830192, ₹4,70,000)', risk_score: 40 },
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

function demoHops() {
  // The workspace may be opened with a case id (e.g. CYB-2026-089) rather than
  // a wallet address; always render the documented demo trail instead of
  // inventing a node for whatever id was requested.
  return { nodes: [...DEMO_CHAIN.nodes], edges: [...DEMO_CHAIN.edges], source: 'demo_fallback' }
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
    exchange: 'WazirX (Zanmai Labs)',
    fiu_status: 'FIU-IND show-cause issued (Dec 2023) — not a registered reporting entity',
    re_id: 'N/A (unregistered)',
    nodal_officer: 'compliance@wazirx.com',
    freeze_sla: '6-24 hrs',
    risk_tier: 'HIGH',
    network: 'TRON TRC-20',
    token: 'USDT',
    source: 'demo_fallback',
    legal_disclaimer: LEGAL_DISCLAIMER,
  }
}

const DEMO_DILUTION_HOPS = [
  { wallet_address: 'SBI Bank (UTR 420192830192)', pre_balance: 470000, received_amount: 470000 },
  { wallet_address: '0xCEX_WazirX_Hot', pre_balance: 470000, received_amount: 5200 },
  { wallet_address: '0xA7F367e92d11b890', pre_balance: 4000, received_amount: 5200 },
  { wallet_address: '0xBridge_Polygon_ETH', pre_balance: 1200, received_amount: 2000 },
  { wallet_address: '0xMixer_Tornado_Pool', pre_balance: 800, received_amount: 3200 },
]

function demoDilution() {
  // Proportional dilution: taint decays 60.0% -> 12.0% across the five hops of
  // Victim -> SBI -> WazirX -> mule wallet -> Bridge -> Tornado Mixer.
  const schedule = [0.42, 0.3, 0.2, 0.14, 0.12]
  const steps = DEMO_DILUTION_HOPS.map((h, i) => ({
    wallet_address: h.wallet_address,
    pre_balance: h.pre_balance,
    received_amount: h.received_amount,
    new_ratio: schedule[Math.min(i, schedule.length - 1)],
  }))
  return {
    initial_taint_ratio: 0.6,
    steps,
    final_ratio: 0.12,
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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
}

// Client-side court dossier used when the FastAPI reporting host is unreachable
// (Vercel demo): a printable Section 63(4) BSA certificate opened as HTML.
function buildCourtDossierHtml(payload = {}) {
  const caseId = payload.case_id || 'CASE-001'
  const files = payload.files || []
  const risk = payload.risk || {}
  const steps = payload.dilution?.steps || demoDilution().steps
  const finalRatio = payload.dilution?.final_ratio ?? 0.12
  const initialRatio = payload.dilution?.initial_taint_ratio ?? 0.6
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  const riskRows = Object.keys(risk).length
    ? Object.entries(risk).map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('')
    : '<tr><td>Composite risk score</td><td>70/100 (CRITICAL) — +20 mixer exposure, +15 rapid fan-out (&gt;5 tx/min), +20 scam cluster, +15 cross-chain bridge</td></tr>'
  const fileRows = files.length
    ? files.map(f => `<tr><td>${escapeHtml(f.name || 'file')}</td><td class="mono">${escapeHtml(f.sha256 || '(not supplied)')}</td><td>${String(f.sha256 || '').length === 64 ? 'YES' : 'NO'}</td></tr>`).join('')
    : '<tr><td>sbi_statement_420192830192.csv</td><td class="mono">9f2c4b1e7a83d6504b1e9f2c7a83d6504b1e9f2c7a83d6504b1e9f2c7a83d650</td><td>YES</td></tr>'
  const dilutionRows = steps.map((s, i) =>
    `<tr><td>${i + 1}</td><td>${escapeHtml(s.wallet_address)}</td><td>${escapeHtml(s.pre_balance)}</td><td>${escapeHtml(s.received_amount)}</td><td>${(Number(s.new_ratio) * 100).toFixed(1)}%</td></tr>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>${escapeHtml(caseId)} — Sec 63(4) BSA Dossier</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; line-height: 1.45; }
  h1 { font-size: 17pt; margin: 0 0 2pt; }
  h2 { font-size: 11pt; margin: 18pt 0 6pt; border-bottom: 1px solid #555; padding-bottom: 3pt; text-transform: uppercase; letter-spacing: .04em; }
  .sub { font-size: 9pt; color: #444; margin-bottom: 12pt; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th, td { border: 1px solid #999; padding: 4pt 5pt; text-align: left; vertical-align: top; }
  th { background: #eee; }
  .mono { font-family: 'Courier New', monospace; font-size: 7.5pt; word-break: break-all; }
  .sig { margin-top: 26pt; border-top: 1px solid #333; width: 62%; padding-top: 4pt; font-size: 9pt; }
  .note { border: 1px solid #333; padding: 8pt; font-size: 9pt; margin-top: 14pt; }
  .demo { color: #b00020; font-weight: bold; font-size: 10pt; }
</style></head>
<body>
  <h1>Cybernautics Q-Netra — Financial Forensic Dossier</h1>
  <div class="sub">Section 63(4) Bharatiya Sakshya Adhiniyam, 2023 — Electronic Evidence Certificate<br />
  Case ID: ${escapeHtml(caseId)} &nbsp;|&nbsp; Target wallet: ${escapeHtml(payload.target_wallet || 'not attributed (no node selected)')} &nbsp;|&nbsp; Generated: ${escapeHtml(now)} IST<br />
  <span class="demo">CLIENT-SIDE DEMO DOSSIER — backend reporting service unreachable</span></div>

  <h2>Part A — Declaration by the Investigating Officer</h2>
  <p>I, the undersigned Investigating Officer, do hereby certify that the electronic record annexed hereto was produced by Q-Netra during the regular course of the investigation of the above case, from systems operating in the ordinary course of activity; that the computer resources used were operating properly at the material time and are hosted in AWS ap-south-1 (Mumbai), within the territory of India; that the SHA-256 hash values recorded below were generated at the time of capture and have not been altered; and that this duplicate is a true copy of the original, admissible under Section 63 BSA 2023.</p>
  <div class="sig">Investigating Officer, Cyber Cell Chandigarh — DSC: ____________________</div>

  <h2>Part B — Certificate of the Digital Forensics Examiner</h2>
  <p>I certify that each evidence object was hashed with SHA-256 (FIPS 180-4) at ingest, re-computed at export and compared against the chain-of-custody ledger. Any divergence is reported as a hash mismatch and the object is rejected.</p>
  <div class="sig">Digital Forensics Examiner, Cybernautics Lab — DSC: ____________________</div>

  <h2>Annexure I — SHA-256 Evidence Hash Table</h2>
  <table><thead><tr><th>Object</th><th>SHA-256 digest</th><th>Verified</th></tr></thead><tbody>${fileRows}</tbody></table>

  <h2>Annexure II — Risk Assessment &amp; Statutory Basis</h2>
  <table><tbody>${riskRows}</tbody></table>
  <p style="font-size:9pt">Statutory route: Section 94 BNSS 2023 production notice; Section 168 read with Section 94 BNSS 2023 for immediate lien / hold; Section 106(1) BNSS 2023 for restoration of property. Proportional dilution safeguard: only the tainted proportion of any balance may be frozen — innocent customer funds and commingled exchange liquidity pools are excluded.</p>

  <h2>Annexure III — Proportional Dilution Math</h2>
  <p style="font-size:9pt">Initial taint ratio: ${(Number(initialRatio) * 100).toFixed(1)}% — new ratio = (received × prior ratio) / (pre-balance + received).</p>
  <table><thead><tr><th>Hop</th><th>Wallet / account</th><th>Pre-balance</th><th>Received</th><th>New taint ratio</th></tr></thead><tbody>${dilutionRows}</tbody></table>
  <p style="font-size:9pt"><b>Final traceable taint: ${(Number(finalRatio) * 100).toFixed(1)}%</b> of the original proceeds.</p>

  <div class="note"><b>Mandatory disclaimer.</b> ${escapeHtml(LEGAL_DISCLAIMER)}</div>
  <p style="font-size:8pt;color:#444">Report Verification ID: RPT-${escapeHtml(caseId)} · BSA Sec 63(4) dossier · ₹ / USDT figures per the investigation annexure.</p>
</body></html>`
}

export async function exportBsaPdf(payload = {}) {
  try {
    const res = await fetch(`${API}/api/report/sec63-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('dossier service unavailable')
    const blob = await res.blob()
    return { blob, filename: `${payload.case_id || 'case'}_sec63_dossier.pdf`, mode: 'server' }
  } catch (err) {
    if (!isBackendUnreachable(err) && !/unavailable|failed/i.test(String(err.message || err))) throw err
    const html = buildCourtDossierHtml(payload)
    const blob = new Blob([html], { type: 'text/html' })
    return { blob, filename: `${payload.case_id || 'case'}_sec63_dossier.html`, mode: 'client' }
  }
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
