'use client'
import { usePathname } from 'next/navigation'
import CommandBar from './CommandBar'
import NavRail from './NavRail'
import { Toaster } from 'sonner'

export default function AppShell({ children }) {
  const pathname = usePathname()
  const isLogin = pathname === '/login'
  if (isLogin) return <>{children}<Toaster theme="dark" /></>
  return (
    <div className="flex flex-col h-screen">
      <CommandBar />
      <div className="flex flex-1 min-h-0">
        <NavRail />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <Toaster theme="dark" />
    </div>
  )
}
