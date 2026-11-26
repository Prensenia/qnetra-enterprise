'use client'
import { useEffect, useState } from 'react'
import { api } from '../../../../lib/api'

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([])
  const [name, setName] = useState('')

  useEffect(() => { api('/api/v1/settings/api-keys').then(setKeys).catch(()=>{}) }, [])

  async function create() {
    const k = await api('/api/v1/settings/api-keys', { method: 'POST', body: JSON.stringify({ name }) })
    setKeys([k, ...keys])
    setName('')
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-cyan">API Keys & Integration</h1>
      <div className="flex gap-2">
        <input className="bg-panel border border-edge rounded px-3 py-2" value={name} onChange={e=>setName(e.target.value)} placeholder="Key name" />
        <button onClick={create} className="px-3 py-2 bg-cyan text-black rounded">Generate API Key</button>
      </div>
      <div className="space-y-2">
        {keys.map(k => (
          <div key={k.id} className="bg-panel border border-edge rounded p-3 font-mono text-xs">
            <div>{k.name}</div>
            <div className="text-slate-400">{k.key}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
