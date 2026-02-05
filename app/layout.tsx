import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Call Agent',
  description: 'Intelligent AI agent for handling voice calls',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
