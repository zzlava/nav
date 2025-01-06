'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      console.log('检查登录状态:', isLoggedIn)
      
      if (!isLoggedIn) {
        console.log('未登录，跳转到登录页面')
        window.location.href = '/admin/login'
      } else {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return <div>加载中...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">管理后台</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">批量添加网站</h2>
        {/* 这里添加批量添加的表单 */}
      </div>
    </div>
  )
} 