const LS = {
  users: 'qnetra_users',
  cases: 'qnetra_cases',
  audit: 'qnetra_audit',
  keys: 'qnetra_api_keys',
  notes: 'qnetra_notes',
}

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

function sha256(str) {
  let h = 0; for (let i=0;i<str.length;i++){ h = (h<<5)-h+str.charCodeAt(i); h|=0 } return Math.abs(h).toString(16)
}

const seedUsers = [
  { email: 'admin@cybernautics.in', password: 'Admin@123', role: 'Lead Investigator', name: 'Admin User' },
  { email: 'auditor@cybernautics.in', password: 'Auditor@123', role: 'Auditor', name: 'Auditor User' },
  { email: 'victim.demo@citizen.in', password: 'Demo@123', role: 'Citizen', name: 'Demo Victim' },
]

const seedCases = [
  { case_id: 'CYB-2026-089', title: 'UPI-to-USDT Mule Syndicate', description: 'Rs 1.42 Cr mule network', nodes: [], edges: [], total_inr: 14200000, total_usdt: 157000 },
  { case_id: 'CYB-2026-094', title: 'Cross-Border Peel Chain', description: 'Pig-butchering peel chain', nodes: [], edges: [], total_inr: 8500000, total_usdt: 94000 },
]

function init() {
  if (!load(LS.users, null)) save(LS.users, seedUsers)
  if (!load(LS.cases, null)) save(LS.cases, seedCases)
  if (!load(LS.audit, null)) save(LS.audit, [])
  if (!load(LS.keys, null)) save(LS.keys, [])
  if (!load(LS.notes, null)) save(LS.notes, {})
}
init()

function getUsers() { return load(LS.users, []) }
function setUsers(u) { save(LS.users, u) }
function getCases() { return load(LS.cases, []) }
function setCases(c) { save(LS.cases, c) }
function getAudit() { return load(LS.audit, []) }
function setAudit(a) { save(LS.audit, a) }
function getKeys() { return load(LS.keys, []) }
function setKeys(k) { save(LS.keys, k) }

function findCase(id) { return getCases().find(c => c.case_id === id) }
function saveCase(c) {
  const cases = getCases()
  const idx = cases.findIndex(x => x.case_id === c.case_id)
  if (idx >= 0) { cases[idx] = c } else { cases.push(c) }
  setCases(cases)
}

function addAudit(caseId, action, details) {
  const a = getAudit()
  a.push({ id: crypto.randomUUID(), case_id: caseId, user_email: 'system', role: 'System', action, details, timestamp_utc: new Date().toISOString(), payload_sha256: sha256(details), prev_hash: '0' })
  setAudit(a)
}

export async function mockHandle(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {}

  if (path === '/api/v1/auth/login' && method === 'POST') {
    const u = getUsers().find(x => x.email === body.email && x.password === body.password)
    if (!u) throw new Error('Invalid credentials')
    return { access_token: 'mock-token', token_type: 'bearer', role: u.role, email: u.email }
  }
  if (path === '/api/v1/auth/register' && method === 'POST') {
    const users = getUsers()
    if (users.find(x => x.email === body.email)) throw new Error('Email exists')
    const u = { email: body.email, password: body.password, role: body.role || 'Citizen', name: body.name || 'User' }
    users.push(u)
    setUsers(users)
    return { access_token: 'mock-token', token_type: 'bearer', role: u.role, email: u.email }
  }

  if (path === '/health') return { status: 'ok', postgres: { status: 'simulated' }, neo4j: { status: 'simulated' }, rpc_adapter: 'fallback_simulator' }

  if (path === '/api/v1/dashboard/summary') {
    const cases = getCases()
    return {
      active_investigations: cases.length,
      total_traced_inr: cases.reduce((a,c)=>a+(c.total_inr||0),0),
      total_traced_usdt: cases.reduce((a,c)=>a+(c.total_usdt||0),0),
      flagged_mule_clusters: 2,
      median_triage_time_hours: 4.2,
      bridge_queue: cases.map(c => ({ case_id: c.case_id, title: c.title, risk_tier: 'CRITICAL', total_inr: c.total_inr })),
    }
  }

  if (path === '/api/v1/citizen/ai-helper' && method === 'POST') {
    const msg = (body.message || '').toLowerCase()
    const cf = body.current_form || {}
    const extracted = {}
    if (msg.includes('upi')) extracted.channel = 'UPI'
    if (msg.includes('crypto') || msg.includes('usdt')) extracted.channel = 'Crypto'
    const amtMatch = msg.match(/(\d[\d,]*)/)
    if (amtMatch && !cf.amount_inr) extracted.amount_inr = parseFloat(amtMatch[1].replace(/,/g,''))
    if (msg.includes('sbi')) extracted.bank_name = 'SBI'
    if (msg.includes('hdfc')) extracted.bank_name = 'HDFC'
    if (msg.includes('icici')) extracted.bank_name = 'ICICI'
    if (msg.includes('don') && msg.includes('know')) {
      if (!cf.utr) extracted.utr = 'UNKNOWN_UTR_BANK_STATEMENT_PENDING'
      if (!cf.suspect_upi) extracted.suspect_upi = 'UNKNOWN_SUSPECT_IDENTIFIER'
      if (!cf.exchange) extracted.exchange = 'UNKNOWN_PLATFORM'
    }
    let reply = 'Take a deep breath. You are not alone. Acting within the Golden Hour gives the strongest chance to freeze funds.'
    if (!cf.victim_bank && !extracted.bank_name) reply += ' First, which bank or UPI app did you use, and roughly how much money was lost?'
    else if (!cf.narrative) reply += ' Can you briefly describe how the scam happened?'
    else if (!cf.utr && !cf.suspect_upi) reply += ' Do you have the 12-digit UTR or suspect UPI/wallet? If not, type I don\'t know.'
    else reply += ' I have captured details. Please review and submit.'
    if (msg.includes('dar') || msg.includes('scared')) reply = 'I hear you, it is understandable to feel scared. ' + reply
    if (msg.includes('called') || msg.includes('1930')) reply = 'Good job calling 1930. ' + reply
    if (msg.includes('don') && msg.includes('know')) reply = 'No problem at all. ' + reply
    if (msg.includes('frozen') || msg.includes('freeze')) reply = 'If your own account is frozen as collateral, submit a 15-day representation letter to the District/State Grievance Officer under NCRP-CFCFRMS SOP Section 9. ' + reply
    return { reply, extracted_fields: extracted, suggested_quick_replies: ['I don\'t know the UTR', 'I don\'t have the suspect ID', 'I already called 1930', 'Help me fill the form'] }
  }

  if (path === '/api/v1/citizen/cases' && method === 'POST') {
    const caseId = `CYB-2026-${100 + getCases().length}`
    const nodes = [{ id: 'VICTIM', type: 'BankAccount', label: 'Victim Account', risk_score: 10, risk_tier: 'LOW', amount_inr: body.amount_inr, timestamp: body.incident_time, metadata: { name: body.complainant_name } }]
    const edges = []
    if (body.suspect_upi && body.suspect_upi !== 'UNKNOWN_SUSPECT_IDENTIFIER') {
      nodes.push({ id: 'SUSPECT_UPI', type: 'UPI', label: body.suspect_upi, risk_score: 75, risk_tier: 'HIGH', amount_inr: body.amount_inr, timestamp: body.incident_time, metadata: {} })
      edges.push({ id: 'e_v_u', source: 'VICTIM', target: 'SUSPECT_UPI', type: 'UPI', amount: body.amount_inr, asset: 'INR', timestamp: body.incident_time, evidence_type: 'confirmed' })
    }
    if (body.suspect_wallet && body.suspect_wallet !== 'UNKNOWN_SUSPECT_IDENTIFIER') {
      nodes.push({ id: 'SUSPECT_WALLET', type: 'CryptoWallet', label: body.suspect_wallet, risk_score: 85, risk_tier: 'CRITICAL', amount_usdt: (body.amount_inr||0)/90, timestamp: body.incident_time, metadata: { exchange: body.exchange } })
      edges.push({ id: 'e_u_w', source: body.suspect_upi && body.suspect_upi !== 'UNKNOWN_SUSPECT_IDENTIFIER' ? 'SUSPECT_UPI' : 'VICTIM', target: 'SUSPECT_WALLET', type: 'Crypto', amount: (body.amount_inr||0)/90, asset: 'USDT', timestamp: body.incident_time, evidence_type: 'inferred' })
    }
    if (body.exchange && body.exchange !== 'UNKNOWN_PLATFORM') {
      nodes.push({ id: 'VASP', type: 'VASPExchange', label: body.exchange, risk_score: 60, risk_tier: 'HIGH', amount_usdt: (body.amount_inr||0)/90, timestamp: body.incident_time, metadata: {} })
      edges.push({ id: 'e_w_vasp', source: 'SUSPECT_WALLET', target: 'VASP', type: 'Exchange', amount: (body.amount_inr||0)/90, asset: 'USDT', timestamp: body.incident_time, evidence_type: 'inferred' })
    }
    const c = { case_id: caseId, title: `Citizen Complaint - ${body.scam_type}`, description: body.narrative, complainant: { name: body.complainant_name }, scam_type: body.scam_type, incident_time: body.incident_time, amount_inr: body.amount_inr, utrs: body.utrs || [], status: 'NEW_CITIZEN_REPORT', nodes, edges, total_inr: body.amount_inr || 0, total_usdt: (body.amount_inr||0)/90 }
    const cases = getCases(); cases.push(c); setCases(cases)
    addAudit(caseId, 'CASE_SUBMITTED', `${body.scam_type} amount ${body.amount_inr}`)
    return { case_id: caseId, status: 'registered' }
  }
  if (path === '/api/v1/citizen/cases' && method === 'GET') {
    return getCases().filter(c => c.complainant)
  }

  const m = path.match(/^\/api\/v1\/cases\/([^/]+)\/graph$/)
  if (m && method === 'GET') {
    const c = findCase(m[1]); if (!c) throw new Error('not found')
    return { case_id: m[1], nodes: c.nodes, edges: c.edges }
  }
  const ma = path.match(/^\/api\/v1\/cases\/([^/]+)\/audit$/)
  if (ma && method === 'GET') {
    return getAudit().filter(a => a.case_id === ma[1])
  }
  const mc = path.match(/^\/api\/v1\/cases\/([^/]+)\/correlations$/)
  if (mc && method === 'GET') {
    return { case_id: mc[1], correlations: [] }
  }
  const man = path.match(/^\/api\/v1\/analyze\/([^/]+)$/)
  if (man && method === 'POST') {
    return { case_id: man[1], risk_score: 85, risk_tier: 'CRITICAL', risk_reasons: [{ rule: 'Velocity Bridge', description: 'Fiat converted to USDT within 30 min', score: 40 }, { rule: 'Smurfing Ring', description: 'Multiple sub-threshold deposits', score: 30 }, { rule: 'Peel Chain', description: 'Multi-hop splitting', score: 15 }] }
  }
  const mag = path.match(/^\/api\/v1\/officer\/ai-agent\/([^/]+)$/)
  if (mag && method === 'POST') {
    return { case_id: mag[1], analysis: 'Freeze choke point identified. Issue BNSS Sec 94 notice immediately.', suggested_action: 'Generate BNSS notice', choke_point: 'VASP' }
  }
  const mnotice = path.match(/^\/api\/v1\/cases\/([^/]+)\/generate-notice$/)
  if (mnotice && method === 'POST') {
    const c = findCase(mnotice[1])
    return { status: 'ok', notice: `NOTICE u/s 94 BNSS 2023\nCase: ${mnotice[1]}\nTraced INR: ${c?.total_inr}` }
  }
  const mpdf = path.match(/^\/api\/v1\/cases\/([^/]+)\/export-pdf$/)
  if (mpdf && method === 'POST') {
    const pdf = `%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF`
    const b64 = btoa(pdf)
    return { pdf_base64: b64, filename: `${mpdf[1]}_dossier.pdf` }
  }
  if (path === '/api/v1/vasp/directory' || path === '/api/v1/vasps') {
    return { vasps: [{ name: 'CoinDCX', fiu_registered: true, lea_email: 'lea@coindcx.com', freeze_sla: '<4hrs', kyc: 'PAN+Aadhaar' }], banks: [] }
  }
  if (path === '/api/v1/settings/api-keys' && method === 'GET') return getKeys()
  if (path === '/api/v1/settings/api-keys' && method === 'POST') {
    const k = { id: crypto.randomUUID(), name: body.name || 'Key', key: 'qnetra_' + Math.random().toString(36).slice(2), created_at: new Date().toISOString(), revoked: false }
    const keys = getKeys(); keys.unshift(k); setKeys(keys)
    return k
  }
  if (path === '/api/v1/ingest/webhook' && method === 'POST') {
    return { status: 'ok', received: true }
  }
  if (path === '/api/v1/ingest/batch' && method === 'POST') {
    return { status: 'ok', filename: 'upload.csv', sha256: 'abc', rows: 3 }
  }

  throw new Error('Mock endpoint not found: ' + path)
}
