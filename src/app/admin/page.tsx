'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)

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