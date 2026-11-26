'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Key, Building2, Wrench } from 'lucide-react'

const activeCase = (typeof window !== 'undefined' && localStorage.getItem('qnetra_active_case')) || 'CYB-2026-101'

const items = [
  { href: '/officer/dashboard', label: 'Command Dashboard', icon: LayoutDashboard },
  { href: `/officer/investigate/${activeCase}`, label: 'Investigation Graph', icon: Search },
  { href: '/officer/vasp-directory', label: 'VASP Directory', icon: Building2 },
  { href: '/officer/tools', label: 'Forensic CSV & Tools', icon: Wrench },
  { href: '/officer/settings/api-keys', label: 'API Keys & Webhooks', icon: Key },
]

export default function NavRail() {
  const pathname = usePathname()
  return (
    <nav className="w-16 bg-panel border-r border-edge flex flex-col items-center py-4 gap-4">
      {items.map(it => {
        const Icon = it.icon
        const active = pathname?.startsWith(`/${it.href.split('/')[1]}/${it.href.split('/')[2]}`) || pathname?.startsWith(it.href.split('/').slice(0,3).join('/'))
        return (
          <Link key={it.href} href={it.href} className={`p-2 rounded ${active ? 'bg-cyan/20 text-cyan' : 'text-slate-400 hover:text-slate-100'}`} title={it.label}>
            <Icon size={20} />
            <span className="sr-only">{it.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
