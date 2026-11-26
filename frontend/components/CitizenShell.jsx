'use client'
import { usePathname, useRouter } from 'next/navigation'
import { Shield, LogOut, Home, FileText } from 'lucide-react'
import Link from 'next/link'

export default function CitizenShell({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  function logout() {
    localStorage.removeItem('qnetra_token')
    localStorage.removeItem('qnetra_role')
    router.push('/login')
  }
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="text-emerald-400" />
          <span className="font-bold text-emerald-400">Q-Netra Citizen Helpdesk</span>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/citizen/helpdesk" className={pathname==='/citizen/helpdesk'?'text-emerald-400':'text-slate-300'}>Helpdesk</Link>
          <Link href="/citizen/my-cases" className={pathname==='/citizen/my-cases'?'text-emerald-400':'text-slate-300'}>My Cases</Link>
          <button onClick={logout} className="text-slate-300 hover:text-white"><LogOut size={16} /></button>
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
