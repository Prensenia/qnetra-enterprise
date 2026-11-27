'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from './AppShell'
import CitizenShell from './CitizenShell'

export default function RootShell({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const role = typeof window !== 'undefined' ? localStorage.getItem('qnetra_role') : null
  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith('/citizen')) {
      if (role && role !== 'Citizen') router.replace('/officer/dashboard')
    } else if (pathname.startsWith('/officer')) {
      if (role === 'Citizen') router.replace('/citizen/helpdesk')
    }
  }, [pathname, role, router])
  if (pathname === '/login' || pathname === '/register') return <>{children}</>
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to Main Content</a>
      <div aria-live="polite" className="sr-only" id="aria-live-region" />
      {pathname?.startsWith('/citizen') ? <CitizenShell>{children}</CitizenShell> : <AppShell>{children}</AppShell>}
    </>
  )
}
