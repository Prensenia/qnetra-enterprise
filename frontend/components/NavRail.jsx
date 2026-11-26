'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Key, Building2 } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/investigate/CYB-2026-089', label: 'Investigate', icon: Search },
  { href: '/vasp-directory', label: 'VASP Intel', icon: Building2 },
  { href: '/settings/api-keys', label: 'API Keys', icon: Key },
]

export default function NavRail() {
  const pathname = usePathname()
  return (
    <nav className="w-16 bg-panel border-r border-edge flex flex-col items-center py-4 gap-4">
      {items.map(it => {
        const Icon = it.icon
        const active = pathname?.startsWith(`/${it.href.split('/')[1]}`)
        return (
          <Link key={it.href} href={it.href} className={`p-2 rounded ${active ? 'bg-cyan/20 text-cyan' : 'text-slate-400 hover:text-slate-100'}`} title={it.label}>
            <Icon size={20} />
          </Link>
        )
      })}
    </nav>
  )
}
