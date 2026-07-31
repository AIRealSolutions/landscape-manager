import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Landscape Service Manager',
  description: 'AI-powered landscape service management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
