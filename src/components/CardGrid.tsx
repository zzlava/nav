'use client'

import React, { useEffect, useState } from 'react'
import Card from './Card'
import { toast } from 'react-hot-toast'

interface Site {
  _id: string
  title: string
  description: string
  url: string
  category: string
  screenshot?: any
}

export function CardGrid() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)

  const loadSites = async () => {
    try {
      console.log('开始加载网站列表...')
      const response = await fetch('/api/sites/list', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('加载失败:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.message || `加载失败: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('获取到的网站列表:', {
        count: data.length,
        sites: data
      })

      // 验证数据格式
      if (!Array.isArray(data)) {
        console.error('返回的数据不是数组:', data)
        throw new Error('数据格式错误')
      }

      // 过滤无效数据
      const validSites = data.filter(site => 
        site && 
        site._id && 
        site.title && 
        site.description && 
        site.url
      )

      if (validSites.length !== data.length) {
        console.warn('存在无效的网站数据:', {
          total: data.length,
          valid: validSites.length,
          invalid: data.filter(site => 
            !site || 
            !site._id || 
            !site.title || 
            !site.description || 
            !site.url
          )
        })
      }

      setSites(validSites)
    } catch (error: any) {
      console.error('加载网站列表失败:', error)
      toast.error(error.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch('/api/delete-site', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      // 从本地状态中移除
      setSites(sites => sites.filter(site => site._id !== id))
      toast.success('删除成功')
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    }
  }

  // 监听添加事件
  useEffect(() => {
    console.log('CardGrid 组件已挂载，开始加载数据...')
    loadSites()

    // 设置定期刷新
    const interval = setInterval(() => {
      console.log('执行定期刷新...')
      loadSites()
    }, 5000)

    // 监听自定义事件
    const handleSiteAdded = () => {
      console.log('检测到新网站添加，立即刷新列表')
      loadSites()
    }

    window.addEventListener('site-added', handleSiteAdded)
    
    return () => {
      console.log('CardGrid 组件卸载，清理事件监听和定时器')
      window.removeEventListener('site-added', handleSiteAdded)
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-2xl aspect-[4/3] mb-4"></div>
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!sites.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-lg">还没有添加任何网站</p>
        <p className="text-sm">在上方输入框中添加你喜欢的网站吧</p>
      </div>
    )
  }

  return (
    <div className="masonry-grid p-6">
      {sites.map(site => (
        <Card
          key={site._id}
          site={site}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
} 