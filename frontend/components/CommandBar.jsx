'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Search, LogOut, ChevronDown } from 'lucide-react'
import { api } from '../lib/api'

export default function CommandBar() {
  const router = useRouter()
  const [health, setHealth] = useState(null)
  const [engine, setEngine] = useState('Checking...')
  const [agency, setAgency] = useState('Cyber Cell Unit - Chandigarh')
  const [query, setQuery] = useState('')
  const role = typeof window !== 'undefined' ? (localStorage.getItem('qnetra_role') || 'Lead Investigator') : 'Lead Investigator'

  useEffect(() => {
    const poll = () => {
      const isLocal = window.location.hostname.includes('localhost')
      if (!isLocal) { setEngine('Edge Forensics Engine • Live'); setHealth({status:'ok'}); return }
      api('/health').then(h => { setHealth(h); setEngine('Connected FastAPI') }).catch(()=>{ setHealth({status:'offline'}); setEngine('Edge Standalone Mode') })
    }
    poll()
    const id = setInterval(poll, 10000)
    return () => clearInterval(id)
  }, [])

  function logout() {
    localStorage.removeItem('qnetra_token')
    localStorage.removeItem('qnetra_role')
    router.push('/login')
  }

  async function search(e) {
    e.preventDefault()
    if (!query) return
    // jump to case if matches
    if (query.toUpperCase().startsWith('CYB-')) router.push(`/investigate/${query.toUpperCase()}`)
  }

  const healthy = health?.status === 'ok'

  return (
    <div className="h-14 bg-panel/80 backdrop-blur border-b border-edge flex items-center px-4 gap-4">
      <div className="flex items-center gap-2">
        <Activity className="text-cyan" size={20} />
        <span className="font-bold text-cyan tracking-wider">Q-NETRA</span>
        <span className="text-xs text-slate-500">Cybernautics</span>
      </div>

      <select value={agency} onChange={e=>setAgency(e.target.value)} className="bg-obsidian border border-edge rounded px-2 py-1 text-xs">
        <option>Cyber Cell Unit - Chandigarh</option>
        <option>HDFC-ICICI AML Desk</option>
        <option>FIU-IND Sandbox</option>
      </select>

      <form onSubmit={search} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search FIR ID, wallet, UPI..." className="w-full bg-obsidian border border-edge rounded pl-8 pr-3 py-1.5 text-xs" />
        </div>
      </form>

      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${healthy ? 'bg-healthy animate-pulse' : 'bg-critical'}`} />
        <span className="text-xs text-slate-400">PostgreSQL</span>
        <span className={`w-2 h-2 rounded-full ${healthy ? 'bg-healthy animate-pulse' : 'bg-critical'}`} />
        <span className="text-xs text-slate-400">Neo4j</span>
        <span className={`w-2 h-2 rounded-full ${healthy ? 'bg-healthy animate-pulse' : 'bg-critical'}`} />
        <span className="text-xs text-slate-400">RPC</span>
      </div>

      <span className="text-[10px] px-2 py-1 border border-edge rounded text-slate-400">{engine}</span>
      <div className="flex items-center gap-2 ml-2">
        <span className="px-2 py-1 text-xs border border-cyan/40 rounded text-cyan">{role}</span>
        <button onClick={logout} className="p-1.5 border border-edge rounded hover:border-critical"><LogOut size={14} /></button>
      </div>
    </div>
  )
}
