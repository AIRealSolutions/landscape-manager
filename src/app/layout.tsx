import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { company } from '@/config/company'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${company.name} — Professional Landscaping`,
  description: `${company.tagline}. ${company.serviceArea}. Get a free quote today.`,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
