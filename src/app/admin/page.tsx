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
      const urlList = urls.split('\n').filter(url => url.trim())
      console.log('准备提交的URL列表:', urlList)
      
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: urlList }),
      })

      const data = await response.json()
      console.log('服务器响应:', data)

      if (!response.ok) {
        throw new Error(data.message || '提交失败')
      }

      if (data.success) {
        toast.success(`添加成功：${data.count} 个网址`)
        setUrls('')
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">管理后台</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">批量添加网站</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="urls" className="block text-sm font-medium text-gray-700 mb-2">
              网址列表（每行一个）
            </label>
            <textarea
              id="urls"
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="https://example.com&#10;https://another-example.com"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : '提交'}
          </button>
        </form>
      </div>
    </div>
  )
} 