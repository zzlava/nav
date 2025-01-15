import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { client } from '@/lib/sanity'
import { analyzeUrl } from '@/lib/gemini'

async function captureScreenshot(url: string): Promise<Buffer | null> {
  try {
    console.log('使用 thum.io 获取截图:', url)
    const auth = '73212-088cfe418adf4a1658b4d4aa9d0d31fb'
    const thumbUrl = `//image.thum.io/get/auth/${auth}/${url}`
    
    // 添加协议前缀
    const fullUrl = `https:${thumbUrl}`
    console.log('完整的 thum.io URL:', fullUrl)
    
    const response = await fetch(fullUrl)
    if (!response.ok) {
      throw new Error(`截图服务返回错误: ${response.status} ${response.statusText}`)
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    console.log('成功获取截图，大小:', buffer.length, '字节')
    return buffer
  } catch (error) {
    console.error('获取截图失败:', error)
    return null
  }
}

async function uploadScreenshot(screenshot: Buffer) {
  try {
    console.log('开始上传截图，大小:', screenshot.length, '字节')
    const asset = await client.assets.upload('image', screenshot, {
      contentType: 'image/jpeg',
      filename: `screenshot-${Date.now()}.jpg`
    })
    console.log('截图上传成功:', asset._id)
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id
      }
    }
  } catch (error) {
    console.error('上传截图失败:', error)
    return null
  }
}

export async function POST(request: Request) {
  console.log('API 路由开始处理请求')
  console.log('环境变量状态:', {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    hasToken: !!process.env.SANITY_API_TOKEN,
    hasGeminiKey: !!process.env.GEMINI_API_KEY
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
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.SANITY_API_TOKEN || !process.env.GEMINI_API_KEY) {
    console.error('缺少必要的环境变量配置')
    return NextResponse.json(
      { 
        success: false, 
        message: '系统配置错误',
        debug: {
          hasProjectId: !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
          hasDataset: !!process.env.NEXT_PUBLIC_SANITY_DATASET,
          hasToken: !!process.env.SANITY_API_TOKEN,
          hasGeminiKey: !!process.env.GEMINI_API_KEY
        }
      },
      { status: 500 }
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

    // 验证和处理 URL
    const validUrls = urls.filter(url => {
      try {
        if (typeof url !== 'string') {
          console.log('URL 不是字符串:', url)
          return false
        }
        const trimmedUrl = url.trim()
        if (!trimmedUrl) {
          console.log('URL 为空')
          return false
        }
        // 确保 URL 以 http:// 或 https:// 开头
        let processedUrl = trimmedUrl
        if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
          processedUrl = 'https://' + processedUrl
        }
        new URL(processedUrl) // 验证 URL 格式
        return true
      } catch (error) {
        console.log('无效的 URL:', url, error)
        return false
      }
    }).map(url => {
      let processedUrl = url.trim()
      if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
        processedUrl = 'https://' + processedUrl
      }
      return processedUrl
    })

    if (validUrls.length === 0) {
      console.log('没有有效的 URL')
      return NextResponse.json(
        { success: false, message: '没有有效的网址' },
        { status: 400 }
      )
    }

    console.log('处理后的有效 URL 列表:', validUrls)

    // 创建文档
    const results = await Promise.all(
      validUrls.map(async (url) => {
        try {
          console.log(`开始处理网站: ${url}`)

          // 使用 Google AI 分析网站
          console.log('调用 AI 分析...')
          const analysis = await analyzeUrl(url)
          console.log('AI 分析结果:', analysis)

          // 获取网站截图
          console.log('开始获取截图...')
          const screenshot = await captureScreenshot(url)
          let screenshotAsset = null
          if (screenshot) {
            console.log('开始上传截图...')
            screenshotAsset = await uploadScreenshot(screenshot)
          }
          console.log('截图处理结果:', screenshotAsset)

          const doc = {
            _type: 'site',
            url,
            title: analysis.title,
            description: analysis.description,
            category: analysis.category,
            screenshot: screenshotAsset,
            createdAt: new Date().toISOString(),
            status: screenshotAsset ? 'active' : 'pending'
          }
          console.log('准备创建文档:', doc)
          const createdDoc = await client.create(doc)
          console.log('文档创建成功:', createdDoc)

          return createdDoc
        } catch (error: any) {
          console.error(`处理网站失败 (${url}):`, error)
          throw error
        }
      })
    )

    console.log('所有网站处理完成:', results)

    return NextResponse.json({
      success: true,
      message: '添加成功',
      count: results.length,
      results
    })
  } catch (error: any) {
    console.error('添加网站失败:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: `服务器错误: ${error.message}`,
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
} 