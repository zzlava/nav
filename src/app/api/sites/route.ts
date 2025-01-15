import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { client, createSite, testConnection } from '@/lib/sanity'

export async function POST(request: Request) {
  console.log('API 路由开始处理请求')
  console.log('Sanity 配置状态:', {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    hasToken: !!process.env.SANITY_API_TOKEN
  })

  // 检查登录状态
  const cookieStore = cookies()
  const isLoggedIn = cookieStore.get('isLoggedIn')?.value === 'true'
  console.log('登录状态:', isLoggedIn)
  
  if (!isLoggedIn) {
    return NextResponse.json(
      { success: false, message: '未登录' },
      { status: 401 }
    )
  }

  // 检查必要的配置
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.SANITY_API_TOKEN) {
    console.error('缺少必要的 Sanity 配置')
    return NextResponse.json(
      { 
        success: false, 
        message: '系统配置错误',
        debug: {
          hasProjectId: !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
          hasDataset: !!process.env.NEXT_PUBLIC_SANITY_DATASET,
          hasToken: !!process.env.SANITY_API_TOKEN
        }
      },
      { status: 500 }
    )
  }

  try {
    // 测试 Sanity 连接
    console.log('开始测试数据库连接...')
    const isConnected = await testConnection()
    console.log('数据库连接测试结果:', isConnected)

    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          message: '无法连接到数据库',
          debug: {
            projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
            dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
            hasToken: !!process.env.SANITY_API_TOKEN
          }
        },
        { status: 500 }
      )
    }

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

    // 创建文档
    const results = await Promise.all(
      validUrls.map(async (url) => {
        try {
          const doc = {
            _type: 'site',
            url,
            createdAt: new Date().toISOString(),
            status: 'pending'
          }
          console.log('准备创建文档:', doc)
          return await createSite(doc)
        } catch (error: any) {
          console.error('创建单个文档失败:', {
            url,
            error: error.message,
            details: error.details
          })
          throw error
        }
      })
    )

    console.log('创建结果:', results)

    return NextResponse.json({
      success: true,
      message: '添加成功',
      count: results.length,
      results
    })
  } catch (error: any) {
    console.error('添加网站失败:', {
      error,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack
    })
    
    return NextResponse.json(
      { 
        success: false, 
        message: `服务器错误: ${error.message}`,
        error: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          statusCode: error.statusCode,
          details: error.details,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    )
  }
} 