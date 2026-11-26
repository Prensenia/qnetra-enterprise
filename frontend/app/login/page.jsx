'use client'
import { useState } from 'react'
import { api } from '../../lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // login | register
  const [roleType, setRoleType] = useState('citizen') // citizen | officer
  // login fields
  const [email, setEmail] = useState('victim.demo@citizen.in')
  const [password, setPassword] = useState('Demo@123')
  // register fields
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [city, setCity] = useState('')
  const [badge, setBadge] = useState('')
  const [agency, setAgency] = useState('Cyber Cell Chandigarh')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  async function login(e) {
    e.preventDefault()
    try {
      const res = await api('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      localStorage.setItem('qnetra_token', res.access_token)
      localStorage.setItem('qnetra_role', res.role)
      toast.success('Signed in')
      if (res.role === 'Citizen') router.push('/citizen/helpdesk')
      else router.push('/officer/dashboard')
    } catch {
      toast.error('Login failed')
    }
  }

  async function register(e) {
    e.preventDefault()
    const role = roleType === 'citizen' ? 'Citizen' : 'Lead Investigator'
    try {
      const res = await api('/api/v1/auth/register', { method: 'POST', body: JSON.stringify({ name, email: regEmail, password: regPassword, role, badge, agency, city, mobile }) })
      localStorage.setItem('qnetra_token', res.access_token)
      localStorage.setItem('qnetra_role', res.role)
      toast.success('Registered')
      if (res.role === 'Citizen') router.push('/citizen/helpdesk')
      else router.push('/officer/dashboard')
    } catch {
      toast.error('Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-2 gap-6">
        {/* Citizen Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-emerald-400 mb-2">Citizen Cyber Fraud Helpdesk</h2>
          <p className="text-sm text-slate-300 mb-4">Lost money to an online scam? Get immediate AI guidance, register your complaint, and alert cyber investigators.</p>
          <div className="space-y-3">
            <button onClick={() => { setEmail('victim.demo@citizen.in'); setPassword('Demo@123'); setMode('login'); setRoleType('citizen') }} className="w-full px-3 py-2 bg-emerald-600 text-white rounded">Demo Citizen Login</button>
            <div className="text-xs text-slate-400">Or register:</div>
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Mobile" value={mobile} onChange={e=>setMobile(e.target.value)} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="City/State" value={city} onChange={e=>setCity(e.target.value)} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Email" value={regEmail} onChange={e=>setRegEmail(e.target.value)} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" type="password" placeholder="Password" value={regPassword} onChange={e=>setRegPassword(e.target.value)} />
            <button onClick={register} className="w-full px-3 py-2 bg-emerald-600 text-white rounded">Register as Citizen</button>
          </div>
        </div>

        {/* Officer Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-cyan mb-2">Law Enforcement & AML Officer Portal</h2>
          <p className="text-sm text-slate-300 mb-4">Authorized Cyber Cell Investigators, Nodal Officers & Compliance Analysts.</p>
          <div className="space-y-3">
            <button onClick={() => { setEmail('admin@cybernautics.in'); setPassword('Admin@123'); setMode('login'); setRoleType('officer') }} className="w-full px-3 py-2 bg-cyan text-black rounded">Demo Officer Login (Lead)</button>
            <button onClick={() => { setEmail('auditor@cybernautics.in'); setPassword('Auditor@123'); setMode('login'); setRoleType('officer') }} className="w-full px-3 py-2 bg-cyan text-black rounded">Demo Auditor Login</button>
            <div className="text-xs text-slate-400">Or register officer:</div>
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Badge/Employee ID" value={badge} onChange={e=>setBadge(e.target.value)} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Agency/Unit" value={agency} onChange={e=>setAgency(e.target.value)} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" placeholder="Official Email" value={regEmail} onChange={e=>setRegEmail(e.target.value)} />
            <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" type="password" placeholder="Password" value={regPassword} onChange={e=>setRegPassword(e.target.value)} />
            <button onClick={() => { setRoleType('officer'); register({preventDefault:()=>{}}) }} className="w-full px-3 py-2 bg-cyan text-black rounded">Register as Officer</button>
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="mt-6 w-full max-w-md mx-auto bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-3">Sign In</h3>
        <form onSubmit={login} className="space-y-3">
          <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
          <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
          <button className="w-full px-3 py-2 bg-slate-700 text-white rounded" type="submit">Sign In</button>
        </form>
      </div>
    </div>
  )
}
