import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { client } from '@/lib/sanity'
import puppeteer from 'puppeteer-core'
import chrome from 'chrome-aws-lambda'

async function captureScreenshot(url: string): Promise<Buffer | null> {
  try {
    console.log('开始截图:', url)
    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: true,
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
    const screenshot = await page.screenshot({ 
      type: 'jpeg',
      encoding: 'binary'
    }) as Buffer
    await browser.close()

    console.log('截图完成:', url)
    return screenshot
  } catch (error) {
    console.error('截图失败:', error)
    return null
  }
}

async function uploadScreenshot(screenshot: Buffer) {
  try {
    const asset = await client.assets.upload('image', screenshot, {
      contentType: 'image/jpeg',
      filename: `screenshot-${Date.now()}.jpg`
    })
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

async function getDescription(url: string) {
  try {
    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: true,
    })

    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
    
    // 获取网站描述
    const description = await page.evaluate(() => {
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')
      const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content')
      return metaDescription || ogDescription || ''
    })

    await browser.close()
    return description
  } catch (error) {
    console.error('获取描述失败:', error)
    return ''
  }
}

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
          // 获取网站描述
          const description = await getDescription(url)
          console.log('获取到的描述:', description)

          // 获取网站截图
          const screenshot = await captureScreenshot(url)
          let screenshotAsset = null
          if (screenshot) {
            screenshotAsset = await uploadScreenshot(screenshot)
          }
          console.log('上传的截图:', screenshotAsset)

          const doc = {
            _type: 'site',
            url,
            description,
            screenshot: screenshotAsset,
            createdAt: new Date().toISOString(),
            status: 'pending'
          }
          console.log('准备创建文档:', doc)
          return await client.create(doc)
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