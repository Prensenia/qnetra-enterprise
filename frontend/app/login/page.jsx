'use client'
import { useState } from 'react'
import { api, isBackendUnreachable } from '../../lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Shield, Lock, User } from 'lucide-react'

const DEMO_TOKEN = 'qnetra-demo-session-token'

const DEMO_ACCOUNTS = {
  'admin@cybernautics.in': { role: 'officer', displayRole: 'Lead Investigator', name: 'IO Pranshu Joshi', redirect: '/officer/dashboard' },
  'auditor@cybernautics.in': { role: 'officer', displayRole: 'Auditor', name: 'Compliance Auditor', redirect: '/officer/dashboard' },
  'victim.demo@citizen.in': { role: 'citizen', displayRole: 'Citizen', name: 'Demo Victim', redirect: '/citizen/helpdesk' },
}

// The backend is unreachable in demo mode, so the session is never validated
// server-side; these keys only satisfy the client-side session guards.
function persistDemoSession(email, demo) {
  localStorage.setItem('qnetra_token', DEMO_TOKEN)
  localStorage.setItem('qnetra_user', JSON.stringify({ email, role: demo.role, name: demo.name }))
  localStorage.setItem('qnetra_role', demo.displayRole)
  localStorage.setItem('qnetra_user_email', email)
  localStorage.setItem('qnetra_demo_mode', 'true')
}

export default function LoginPage() {
  const router = useRouter()
  const [briefOpen, setBriefOpen] = useState(false)
  const [districts, setDistricts] = useState(5)
  const [vasps, setVasps] = useState(10)
  const arr = districts * 500000 + vasps * 200000
  const timeSaved = districts * 120
  const fundsProtected = districts * 10000000
  const [portal, setPortal] = useState('citizen') // citizen | officer
  const [mode, setMode] = useState('login') // login | register
  const [email, setEmail] = useState('victim.demo@citizen.in')
  const [password, setPassword] = useState('Citizen@123')
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [city, setCity] = useState('')
  const [badge, setBadge] = useState('')
  const [agency, setAgency] = useState('Cyber Cell Chandigarh')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  function signInDemo(demo, normalizedEmail) {
    persistDemoSession(normalizedEmail, demo)
    toast.success('Signed in (Demo Mode)')
    router.push(demo.redirect)
  }

  // The backend exposes the login route under /api/v1/auth; try the bare
  // /api/auth path first (as documented), then the versioned one, and only
  // fall back to a demo session if the host is unreachable at all.
  async function attemptLogin(body) {
    try {
      return await api('/api/auth/login', { method: 'POST', body })
    } catch (err) {
      if (isBackendUnreachable(err)) throw err
      return api('/api/v1/auth/login', { method: 'POST', body })
    }
  }

  async function login(e) {
    e.preventDefault()
    try {
      const res = await attemptLogin(JSON.stringify({ email, password }))
      localStorage.setItem('qnetra_token', res.access_token)
      localStorage.setItem('qnetra_role', res.role)
      localStorage.setItem('qnetra_user_email', res.email)
      toast.success('Signed in')
      if (res.role === 'Citizen') router.push('/citizen/helpdesk')
      else router.push('/officer/dashboard')
    } catch (err) {
      // Vercel deployment without a reachable FastAPI host: fall back to a demo
      // session for the three seeded accounts only.
      const demo = DEMO_ACCOUNTS[String(email).trim().toLowerCase()]
      if (isBackendUnreachable(err) && demo) {
        signInDemo(demo, String(email).trim().toLowerCase())
        return
      }
      toast.error('Login failed')
    }
  }

  async function register(e) {
    e.preventDefault()
    const role = portal === 'citizen' ? 'Citizen' : 'Lead Investigator'
    try {
      const res = await api('/api/v1/auth/register', { method: 'POST', body: JSON.stringify({ name, email: regEmail, password: regPassword, role, badge, agency, city, mobile }) })
      localStorage.setItem('qnetra_token', res.access_token)
      localStorage.setItem('qnetra_role', res.role)
      localStorage.setItem('qnetra_user_email', res.email)
      toast.success('Registered')
      if (res.role === 'Citizen') router.push('/citizen/helpdesk')
      else router.push('/officer/dashboard')
    } catch {
      toast.error('Registration failed')
    }
  }

  function demoCitizen() { setEmail('victim.demo@citizen.in'); setPassword('Citizen@123'); setPortal('citizen') }
  function demoOfficer() { setEmail('admin@cybernautics.in'); setPassword('Admin@123'); setPortal('officer') }
  function demoAuditor() { setEmail('auditor@cybernautics.in'); setPassword('Auditor@123'); setPortal('officer') }

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid grid-cols-2 gap-8">
        {/* Left: value + portal selector */}
        <div className="space-y-6">
          <div>
            <div className="text-xs tracking-widest text-cyan mb-1">CYBERNAUTICS // Q-NETRA</div>
            <h1 className="text-3xl font-bold text-white">Hybrid Financial Forensics & 1930 Golden-Hour Triage Suite</h1>
            <div className="mt-2 inline-block px-3 py-1 text-xs border border-cyan/40 rounded text-cyan">I4C-CFCFRMS Companion • FIU-IND PMLA Ready • BNSS 2023 Compliant</div>
          </div>
          <div className="space-y-3">
            <button onClick={() => setPortal('citizen')} className={`w-full p-4 rounded-lg border text-left ${portal==='citizen' ? 'border-emerald-500 bg-emerald-950/40' : 'border-edge bg-panel'}`}>
              <div className="font-bold text-emerald-400 flex items-center gap-2"><Shield size={18} /> Citizen Cyber Fraud Helpdesk</div>
              <div className="text-xs text-slate-400 mt-1">Victim Relief & 1930 Companion</div>
            </button>
            <button onClick={() => setPortal('officer')} className={`w-full p-4 rounded-lg border text-left ${portal==='officer' ? 'border-cyan bg-cyan/10' : 'border-edge bg-panel'}`}>
              <div className="font-bold text-cyan flex items-center gap-2"><Lock size={18} /> Law Enforcement & VASP Compliance Workbench</div>
              <div className="text-xs text-slate-400 mt-1">Officer Portal</div>
            </button>
          </div>
        </div>

        {/* Right: auth card */}
        <div className="bg-panel border border-edge rounded-xl p-6">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setMode('login')} className={`px-3 py-1 rounded text-sm ${mode==='login' ? 'bg-cyan text-black' : 'border border-edge'}`}>Sign In</button>
            <button onClick={() => setMode('register')} className={`px-3 py-1 rounded text-sm ${mode==='register' ? 'bg-cyan text-black' : 'border border-edge'}`}>Create New Account</button>
          </div>

          {/* instant demo */}
          <div className="mb-4 flex gap-2 flex-wrap">
            {portal === 'citizen' ? (
              <button onClick={demoCitizen} className="px-3 py-2 bg-emerald-600 text-white rounded text-sm">Instant Demo: Enter Citizen Helpdesk</button>
            ) : (
              <>
                <button onClick={demoOfficer} className="px-3 py-2 bg-cyan text-black rounded text-sm">Demo: Lead Investigator</button>
                <button onClick={demoAuditor} className="px-3 py-2 bg-cyan text-black rounded text-sm">Demo: Compliance Auditor</button>
              </>
            )}
          </div>

          {mode === 'login' ? (
            <form onSubmit={login} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input className="w-full bg-obsidian border border-edge rounded pl-9 pr-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
              </div>
              <input className="w-full bg-obsidian border border-edge rounded px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
              <button className="w-full px-3 py-2 bg-cyan text-black rounded font-semibold" type="submit">Sign In</button>
            </form>
          ) : (
            <form onSubmit={register} className="space-y-3">
              <input className="w-full bg-obsidian border border-edge rounded px-3 py-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
              {portal === 'citizen' ? (
                <>
                  <input className="w-full bg-obsidian border border-edge rounded px-3 py-2" placeholder="Mobile" value={mobile} onChange={e=>setMobile(e.target.value)} />
                  <input className="w-full bg-obsidian border border-edge rounded px-3 py-2" placeholder="City/State" value={city} onChange={e=>setCity(e.target.value)} />
                </>
              ) : (
                <>
                  <input className="w-full bg-obsidian border border-edge rounded px-3 py-2" placeholder="Badge/Employee ID" value={badge} onChange={e=>setBadge(e.target.value)} />
                  <input className="w-full bg-obsidian border border-edge rounded px-3 py-2" placeholder="Agency/Unit" value={agency} onChange={e=>setAgency(e.target.value)} />
                </>
              )}
              <input className="w-full bg-obsidian border border-edge rounded px-3 py-2" placeholder="Email" value={regEmail} onChange={e=>setRegEmail(e.target.value)} />
              <input className="w-full bg-obsidian border border-edge rounded px-3 py-2" type="password" placeholder="Password" value={regPassword} onChange={e=>setRegPassword(e.target.value)} />
              <button className="w-full px-3 py-2 bg-cyan text-black rounded font-semibold" type="submit">Create Account</button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button onClick={() => setBriefOpen(true)} className="text-xs text-cyan underline">VBYLD 2027 Policy & Revenue Brief</button>
      </div>

      {briefOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setBriefOpen(false)}>
          <div className="bg-panel border border-edge rounded-xl p-6 max-w-2xl w-full mx-4" onClick={e=>e.stopPropagation()}>
            <h2 className="text-lg font-bold text-cyan mb-3">VBYLD 2027 Policy & Revenue Brief</h2>
            <div className="text-sm text-slate-300 space-y-3">
              <p><strong>NCRP–CFCFRMS Integration:</strong> Q-Netra bridges Layer-1 bank holds with FIU-IND VASP freezes under Section 94 read with Section 168 & Section 106 BNSS, 2023 and BSA Section 63.</p>
              <p><strong>National Impact:</strong> Cuts IO notice drafting from 4 hrs to 45 sec, supports 6 Indian languages + voice accessibility for Divyangjan/elderly, streamlines BNSS Sec 106 / Sec 503 victim fund restoration.</p>
              <p><strong>B2G + B2B RegTech Model:</strong> State Cyber Cell SaaS + FIU-IND VASP Compliance Webhook API + Bank Mule-Velocity API (₹0 free citizen access).</p>
              <div className="border border-edge rounded p-3 space-y-2">
                <div className="text-xs font-bold text-cyan">B2G + B2B SaaS Revenue & Golden-Hour Recovery Simulator</div>
                <label className="text-xs">Onboarded Police Districts: {districts}</label>
                <input type="range" min="1" max="50" value={districts} onChange={e=>setDistricts(Number(e.target.value))} className="w-full" />
                <label className="text-xs">FIU-IND VASPs: {vasps}</label>
                <input type="range" min="1" max="30" value={vasps} onChange={e=>setVasps(Number(e.target.value))} className="w-full" />
                <div className="text-xs">ARR: ₹{arr.toLocaleString()}</div>
                <div className="text-xs">IO Time Saved: {timeSaved} hrs/month</div>
                <div className="text-xs">Funds Protected: ₹{fundsProtected.toLocaleString()}</div>
              </div>
            </div>
            <button onClick={() => setBriefOpen(false)} className="mt-4 px-3 py-2 bg-cyan text-black rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
