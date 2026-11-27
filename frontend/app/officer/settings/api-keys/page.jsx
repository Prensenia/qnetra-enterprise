'use client'
import { useEffect, useState } from 'react'
import { api, isBackendUnreachable } from '../../../../lib/api'
import { toast } from 'sonner'

// Shown when the FastAPI host is unreachable (Vercel demo) so the page explains
// the integration surface instead of rendering an empty list.
const DEMO_KEYS = [
  { id: 'demo-key-1', name: 'Cyber Cell Chandigarh — demo key', key: 'qnetra_demo_9f2c4b1e7a83d6504b1e9f2c' },
]

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([])
  const [name, setName] = useState('')
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    api('/api/v1/settings/api-keys')
      .then(setKeys)
      .catch(err => {
        if (isBackendUnreachable(err)) {
          setKeys(DEMO_KEYS)
          setOffline(true)
          return
        }
        toast.error('Could not load API keys')
      })
  }, [])

  async function create() {
    try {
      const k = await api('/api/v1/settings/api-keys', { method: 'POST', body: JSON.stringify({ name }) })
      setKeys([k, ...keys])
      toast.success('API key generated')
    } catch (err) {
      if (!isBackendUnreachable(err)) {
        toast.error('Key creation rejected by backend')
        return
      }
      const random = typeof crypto !== 'undefined' && crypto.getRandomValues
        ? Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => b.toString(16).padStart(2, '0')).join('')
        : Date.now().toString(16)
      setKeys([{ id: `demo-${Date.now()}`, name: name || 'Demo key', key: `qnetra_demo_${random}` }, ...keys])
      setOffline(true)
      toast.success('Demo key issued — not persisted (backend unreachable)')
    }
    setName('')
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-cyan">API Keys & Integration</h1>
      {offline && (
        <div className="px-3 py-2 bg-amber-950 border border-amber-700 rounded text-xs text-amber-200">
          Backend unreachable — these keys are demonstration values. The ingest and webhook endpoints are live when the FastAPI host is running.
        </div>
      )}
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
