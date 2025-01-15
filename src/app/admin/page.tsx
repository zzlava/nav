'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [urls, setUrls] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!urls.trim()) {
      toast.error('请输入网址')
      return
    }

    setIsLoading(true)
    try {
      // 处理 URL 列表
      const urlList = urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)

      if (urlList.length === 0) {
        toast.error('没有有效的网址')
        return
      }

      console.log('准备提交的URL列表:', urlList)
      
      const response = await fetch('/api/add-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: urlList }),
        credentials: 'include'
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('服务器返回错误:', text)
        try {
          const data = JSON.parse(text)
          throw new Error(data.message || '提交失败')
        } catch (e) {
          throw new Error(`服务器返回错误: ${response.status}`)
        }
      }

      const data = await response.json()
      console.log('服务器响应:', data)

      if (data.success) {
        toast.success(`添加成功：${data.count} 个网址`)
        setUrls('')
        
        // 使用 localStorage 作为通信机制
        localStorage.setItem('lastUpdate', new Date().toISOString())
        
        // 发送自定义事件
        const event = new CustomEvent('site-added')
        window.dispatchEvent(event)
      } else {
        toast.error(data.message || '添加失败')
      }
    } catch (error: any) {
      console.error('提交失败:', error)
      toast.error(error.message || '操作失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">批量添加网站</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              网站列表（每行一个）
            </label>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              className="w-full h-48 p-3 rounded-lg border focus:ring-2 focus:ring-primary"
              placeholder="https://example.com&#10;https://another-example.com"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? '提交中...' : '提交'}
          </button>
        </form>
      </div>
    </div>
  )
} 