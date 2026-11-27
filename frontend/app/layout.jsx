import './globals.css'
import RootShell from '../components/RootShell'
import DemoOverlay from '../components/DemoOverlay'
import { Toaster } from 'sonner'
import { DemoModeProvider } from '../context/DemoModeContext'

export const metadata = {
  title: 'Q-Netra Enterprise',
  description: 'Cybercrime & Financial Forensics Suite',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <DemoModeProvider>
          <RootShell>{children}</RootShell>
          <DemoOverlay />
          <Toaster theme="dark" />
        </DemoModeProvider>
      </body>
    </html>
  )
}
