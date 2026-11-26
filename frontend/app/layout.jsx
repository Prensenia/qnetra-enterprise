import './globals.css'
import RootShell from '../components/RootShell'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'Q-Netra Enterprise',
  description: 'Cybercrime & Financial Forensics Suite',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <RootShell>{children}</RootShell>
        <Toaster theme="dark" />
      </body>
    </html>
  )
}
