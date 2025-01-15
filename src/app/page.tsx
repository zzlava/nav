'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/Card'
import ThemeToggle from '@/components/theme-toggle'
import { toast } from 'react-hot-toast'

// 定义分类
const categories = [
  { id: 'all', name: '全部', icon: '📑' },
  { id: 'social', name: '社交', icon: '💬' },
  { id: 'tech', name: '技术', icon: '💻' },
  { id: 'news', name: '新闻', icon: '📰' },
  { id: 'tools', name: '工具', icon: '🛠' },
  { id: 'others', name: '其他', icon: '📌' },
]

export default function Home() {
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')

  // 定义加载函数
  const loadSites = async () => {
    try {
      setError(null)
      console.log('开始加载网站列表...')
      const response = await fetch('/api/sites/list', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (!response.ok) {
        throw new Error('加载失败')
      }
      const data = await response.json()
      console.log('加载到的网站列表:', data)
      setSites(data)
    } catch (error: any) {
      console.error('加载网站失败:', error)
      setError(error.message || '加载失败')
      toast.error('加载网站列表失败，请刷新页面重试')
    } finally {
      setLoading(false)
    }
  }

  // 首次加载
  useEffect(() => {
    loadSites()
  }, [])

  // 定期刷新数据
  useEffect(() => {
    const interval = setInterval(loadSites, 5000) // 每5秒刷新一次
    return () => clearInterval(interval)
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个网站吗？')) return

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

      setSites(sites.filter(site => site._id !== id))
      toast.success('删除成功')
      
      // 删除成功后立即刷新数据
      await loadSites()
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败，请重试')
    }
  }

  // 过滤网站列表
  const filteredSites = sites.filter(site => 
    activeCategory === 'all' ? true : site.category === activeCategory
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
          <div className="text-center text-muted-foreground">
            加载中...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
          <div className="text-center text-red-500">
            {error}
            <button
              onClick={loadSites}
              className="ml-4 text-blue-500 hover:underline"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background/50 dark:bg-background">
      {/* 顶部导航栏 */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                网站导航
              </h1>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                Beta
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={loadSites}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                刷新
              </button>
              <a
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                管理后台
              </a>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* 左侧分类栏 */}
          <div className="w-48 shrink-0">
            <div className="sticky top-24 space-y-1">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="text-base">{category.icon}</span>
                  <span>{category.name}</span>
                  {activeCategory === category.id && (
                    <span className="ml-auto text-xs font-medium">
                      {filteredSites.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">网站列表</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  点击卡片访问对应网站
                </p>
              </div>
              
              {filteredSites.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center text-muted-foreground">
                  <svg className="mb-4 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-lg">
                    {activeCategory === 'all' 
                      ? '还没有添加任何网站' 
                      : `没有${categories.find(c => c.id === activeCategory)?.name}类网站`}
                  </p>
                  <p className="text-sm">请联系管理员添加网站</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredSites.map(site => (
                    <Card
                      key={site._id}
                      {...site}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="mt-8 border-t py-6">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="text-center text-sm text-muted-foreground">
            使用 Next.js + Sanity + Tailwind CSS 构建
          </div>
        </div>
      </footer>
    </main>
  )
} 