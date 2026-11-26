'use client'
import { useState } from 'react'
import { api, setToken } from '../../lib/api'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@cybernautics.in')
  const [password, setPassword] = useState('Admin@123')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await api('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      setToken(res.access_token)
      router.push('/dashboard')
    } catch (err) {
      setError('Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian">
      <div className="w-full max-w-md bg-panel border border-edge rounded-lg p-6">
        <h1 className="text-xl font-bold text-cyan mb-4">Q-Netra Login</h1>
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setEmail('admin@cybernautics.in'); setPassword('Admin@123') }} className="px-2 py-1 text-xs border border-edge rounded">Admin</button>
          <button onClick={() => { setEmail('auditor@cybernautics.in'); setPassword('Auditor@123') }} className="px-2 py-1 text-xs border border-edge rounded">Auditor</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input className="w-full bg-obsidian border border-edge rounded px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
          <input className="w-full bg-obsidian border border-edge rounded px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
          {error && <p className="text-critical text-sm">{error}</p>}
          <button className="w-full bg-cyan text-black font-semibold py-2 rounded" type="submit">Sign In</button>
        </form>
      </div>
    </div>
  )
}
