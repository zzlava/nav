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
    const body = await request.json()
    console.log('接收到的请求体:', body)
    
    const { urls } = body
    
    if (!Array.isArray(urls) || urls.length === 0) {
      console.log('无效的URL列表:', urls)
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
      } catch (error) {
        console.log('无效的URL:', url, error)
        return false
      }
    })

    if (validUrls.length === 0) {
      return NextResponse.json(
        { success: false, message: '没有有效的网址' },
        { status: 400 }
      )
    }

    console.log('准备创建的有效URL:', validUrls)

    // 创建Sanity文档
    const documents = validUrls.map(url => ({
      _id: `site-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'site',
      url,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }))

    console.log('准备创建的文档:', documents)

    // 使用事务批量创建文档
    const transaction = documents.reduce((tx, doc) => {
      return tx.createIfNotExists(doc)
    }, client.transaction())

    console.log('开始提交事务...')
    await transaction.commit()
    console.log('事务提交成功')

    return NextResponse.json({
      success: true,
      message: '添加成功',
      count: validUrls.length
    })
  } catch (error: any) {
    console.error('添加网站失败:', {
      error,
      message: error.message,
      stack: error.stack
    })
    
    return NextResponse.json(
      { 
        success: false, 
        message: `服务器错误: ${error.message}`,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 