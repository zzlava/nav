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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pauseAutoRefresh, setPauseAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch('/api/check-login')
        const data = await response.json()
        setIsLoggedIn(data.isLoggedIn)
      } catch (error) {
        console.error('检查登录状态失败:', error)
        setIsLoggedIn(false)
      }
    }
    checkLoginStatus()
  }, [])

  // 定义加载函数
  const loadSites = async () => {
    try {
      setError(null)
      console.log('开始加载网站列表...')
      const timestamp = new Date().getTime() // 添加时间戳防止缓存
      const response = await fetch(`/api/sites/list?t=${timestamp}`, {
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

      console.log('加载到的网站列表:', data)
      if (!Array.isArray(data)) {
        throw new Error('返回的数据不是数组格式')
      }

      setSites(data)
    } catch (error: any) {
      console.error('加载网站失败:', error)
      setError(error.message || '加载失败')
      toast.error('加载网站列表失败，请刷新页面重试')
    } finally {
      setLoading(false)
    }
  }

  // 监听 localStorage 变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastUpdate') {
        console.log('检测到数据更新:', e.newValue)
        loadSites()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 监听自定义事件
  useEffect(() => {
    const handleSiteAdded = () => {
      console.log('检测到网站添加事件')
      loadSites()
    }
    window.addEventListener('site-added', handleSiteAdded)
    return () => window.removeEventListener('site-added', handleSiteAdded)
  }, [])

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
    }, 5 * 60 * 1000) // 5分钟刷新一次

    return () => {
      console.log('清理定时器')
      clearInterval(interval)
    }
  }, [pauseAutoRefresh])

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
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                雷少的导航
              </h1>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                Beta
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
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
            <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">网站列表</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  点击卡片访问对应网站
                </p>
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