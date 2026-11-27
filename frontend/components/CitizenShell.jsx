'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Shield, LogOut, Type } from 'lucide-react'
import Link from 'next/link'
import { A11Y_EVENT, readA11y, toggleA11y } from '../lib/a11y'

export default function CitizenShell({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [a11y, setA11y] = useState(false)

  useEffect(() => {
    setA11y(readA11y())
    const onChange = (e) => setA11y(Boolean(e.detail?.on))
    window.addEventListener(A11Y_EVENT, onChange)
    return () => window.removeEventListener(A11Y_EVENT, onChange)
  }, [])

  function logout() {
    localStorage.removeItem('qnetra_token')
    localStorage.removeItem('qnetra_role')
    localStorage.removeItem('qnetra_user')
    localStorage.removeItem('qnetra_user_email')
    localStorage.removeItem('qnetra_demo_mode')
    router.push('/login')
  }

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 ${a11y ? 'a11y-boost' : ''}`}>
      <header className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Shield className="text-emerald-400" />
          <span className="font-bold text-emerald-400">Q-Netra Citizen Helpdesk</span>
        </div>
        <nav className="flex gap-4 text-sm items-center">
          <Link href="/citizen/helpdesk" className={pathname==='/citizen/helpdesk'?'text-emerald-400':'text-slate-300'}>Helpdesk</Link>
          <Link href="/citizen/my-cases" className={pathname==='/citizen/my-cases'?'text-emerald-400':'text-slate-300'}>My Cases</Link>
          <button
            onClick={() => setA11y(toggleA11y(a11y))}
            aria-pressed={a11y}
            aria-label="Accessibility Mode: High-Contrast and Large Text"
            className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${a11y ? 'bg-amber-300 text-black border-amber-200 font-bold' : 'border-slate-600 text-slate-300'}`}
          >
            <Type size={14} /> A+ High-Contrast
          </button>
          <button onClick={logout} aria-label="Sign out" className="text-slate-300 hover:text-white"><LogOut size={16} /></button>
        </nav>
      </header>
      <main id="main-content" className="p-6">{children}</main>
    </div>
  )
}
