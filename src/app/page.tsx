'use client'

import { useEffect, useState, useCallback } from 'react'
import Card from '@/components/Card'
import ThemeToggle from '@/components/theme-toggle'
import { toast } from 'react-hot-toast'

interface Site {
  _id: string
  title: string
  description: string
  url: string
  category: string
  screenshot?: {
    asset?: {
      _ref: string
    }
  }
}

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
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pauseAutoRefresh, setPauseAutoRefresh] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now())

  const REFRESH_INTERVAL = 5 * 60 * 1000 // 5分钟的刷新间隔

  // 检查登录状态
  const checkLoginStatus = async () => {
    try {
      const response = await fetch('/admin/api/check-auth')
      const data = await response.json()
      setIsLoggedIn(data.isLoggedIn)
    } catch (error) {
      console.error('检查登录状态失败:', error)
      setIsLoggedIn(false)
    }
  }

  // 定义加载函数
  const loadSites = useCallback(async (force = false) => {
    // 检查是否需要刷新
    const now = Date.now()
    const lastUpdate = localStorage.getItem('lastUpdate')
    const timeSinceLastRefresh = now - lastRefreshTime

    // 如果不是强制刷新，且未达到刷新间隔，且没有新的更新，则跳过
    if (!force && 
        timeSinceLastRefresh < REFRESH_INTERVAL && 
        (!lastUpdate || new Date(lastUpdate).getTime() < lastRefreshTime)) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/sites/list', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (!response.ok) {
        throw new Error('加载失败')
      }

      const text = await response.text()
      console.log('服务器返回的原始数据:', text)

      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.error('解析返回数据失败:', e)
        throw new Error('数据格式错误')
      }

      if (!Array.isArray(data)) {
        throw new Error('返回的数据不是数组格式')
      }

      setSites(data)
      setError(null)
      setLastRefreshTime(now)
    } catch (err) {
      console.error('加载网站列表失败:', err)
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [lastRefreshTime])

  // 监听后台更新事件
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastUpdate') {
        loadSites(true) // 强制刷新
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [loadSites])

  useEffect(() => {
    loadSites()
    checkLoginStatus()
  }, [loadSites])

  // 监听自定义事件
  useEffect(() => {
    const handleSiteAdded = () => {
      console.log('检测到网站添加事件')
      loadSites(true)
    }
    window.addEventListener('site-added', handleSiteAdded)
    return () => window.removeEventListener('site-added', handleSiteAdded)
  }, [loadSites])

  // 首次加载和定期刷新
  useEffect(() => {
    loadSites() // 首次加载

    if (pauseAutoRefresh) {
      console.log('自动刷新已暂停')
      return
    }
    
    console.log('启动自动刷新')
    const interval = setInterval(() => {
      console.log('执行定时刷新')
      loadSites()
    }, REFRESH_INTERVAL) // 使用 REFRESH_INTERVAL 而不是固定的 5000

    return () => {
      console.log('清理定时器')
      clearInterval(interval)
    }
  }, [pauseAutoRefresh, loadSites])

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个网站吗？')) return

    try {
      // 暂停自动刷新
      setPauseAutoRefresh(true)

      const response = await fetch(`/api/sites/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || '删除失败')
      }

      // 从本地状态中移除
      setSites(prevSites => prevSites.filter(site => site._id !== id))
      toast.success('删除成功')
      
      // 等待 2 秒后恢复自动刷新
      setTimeout(() => {
        setPauseAutoRefresh(false)
        loadSites()
      }, 2000)
    } catch (error: any) {
      console.error('删除失败:', error)
      if (error.message === '未登录') {
        toast.error('请先在管理后台登录')
      } else {
        toast.error(error.message || '删除失败，请重试')
      }
      // 发生错误时也要恢复自动刷新
      setPauseAutoRefresh(false)
    }
  }

  // 过滤网站列表
  const filteredSites = sites.filter(site => 
    activeCategory === 'all' ? true : site.category === activeCategory
  )

  // 处理刷新按钮点击
  const handleRefreshClick = () => {
    loadSites(true)
  }

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
              onClick={() => loadSites(true)}
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
    <main className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 dark:bg-background/95">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                雷少的导航
              </h1>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                Beta
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleRefreshClick}
                className="hidden sm:inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                刷新
              </button>
              <a
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                管理
              </a>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* 左侧分类栏 - 在移动端水平滚动 */}
          <div className="sm:w-48 sm:shrink-0 -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="sm:sticky sm:top-24 flex sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex-shrink-0 sm:flex-shrink inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                    activeCategory === category.id
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
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
            <div className="rounded-lg border bg-card text-card-foreground dark:border-neutral-800 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">网站列表</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    点击卡片访问对应网站
                  </p>
                </div>
                <button
                  onClick={handleRefreshClick}
                  className="sm:hidden inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                >
                  刷新
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredSites.length > 0 ? (
                  filteredSites.map((site) => (
                    <Card
                      key={site._id}
                      site={site}
                      onDelete={isLoggedIn ? handleDelete : undefined}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center text-muted-foreground">
                    还没有添加任何网站
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="mt-8 border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>© 2024 雷少的导航. All rights reserved.</p>
      </footer>
    </main>
  )
}