import './globals.css'
import { Toaster } from 'react-hot-toast'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '雷少的导航',
  description: '一个现代化的网站导航工具，收集和分享有价值的网站资源。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
