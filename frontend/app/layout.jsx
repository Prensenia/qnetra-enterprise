import './globals.css'

export const metadata = {
  title: 'Q-Netra Enterprise',
  description: 'Cybercrime & Financial Forensics Suite',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
