'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function AdminPage() {
  const [urls, setUrls] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urls.trim()) return

    const urlList = urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url)

    if (!urlList.length) {
      toast.error('请输入至少一个网址')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/batch-add-sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: urlList }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '添加失败')
      }

      toast.success('添加成功')
      setUrls('')
    } catch (err: any) {
      toast.error(err.message || '添加失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                网站管理
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">批量添加网站</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              每行输入一个网址，支持批量导入
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com"
              rows={10}
              className="w-full rounded-md border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !urls.trim()}
                className="btn btn-primary px-4 py-2"
              >
                {loading ? '添加中...' : '批量添加'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 