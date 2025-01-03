import { Toaster } from 'react-hot-toast'
import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '网站导航',
  description: '个人网站导航',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ThemeProvider>
          <div className="min-h-screen bg-background">
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                className: '',
                style: {
                  border: '1px solid #713200',
                  padding: '16px',
                  color: '#713200',
                },
              }}
            />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
