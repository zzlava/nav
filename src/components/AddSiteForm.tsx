'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface AddSiteFormProps {
  onSuccess?: () => void
}

export function AddSiteForm({ onSuccess }: AddSiteFormProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)

    try {
      const res = await fetch('/api/add-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '添加失败')
      }

      setUrl('')
      toast.success('添加成功')
      onSuccess?.()
    } catch (err: any) {
      toast.error(err.message || '添加失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入网址，如 https://example.com"
            className="input w-full pr-24"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? '添加中...' : '添加'}
          </button>
        </div>
      </div>
    </form>
  )
} 