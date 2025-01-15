import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { client } from '@/lib/sanity'

export async function POST(request: Request) {
  // 检查登录状态
  const cookieStore = cookies()
  const isLoggedIn = cookieStore.get('isLoggedIn')?.value === 'true'
  
  if (!isLoggedIn) {
    return NextResponse.json(
      { success: false, message: '未登录' },
      { status: 401 }
    )
  }

  try {
    const { urls } = await request.json()
    
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, message: '无效的网址列表' },
        { status: 400 }
      )
    }

    // 验证URL格式
    const validUrls = urls.filter(url => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    })

    if (validUrls.length === 0) {
      return NextResponse.json(
        { success: false, message: '没有有效的网址' },
        { status: 400 }
      )
    }

    // 创建Sanity文档
    const documents = validUrls.map(url => ({
      _id: `site-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'site',
      url,
      createdAt: new Date().toISOString(),
    }))

    // 使用事务批量创建文档
    const transaction = documents.reduce((tx, doc) => {
      return tx.createIfNotExists(doc)
    }, client.transaction())

    await transaction.commit()

    return NextResponse.json({
      success: true,
      message: '添加成功',
      count: validUrls.length
    })
  } catch (error) {
    console.error('Error adding sites:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
} 