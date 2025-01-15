import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { client } from '@/lib/sanity'
import puppeteer from 'puppeteer-core'
import chrome from 'chrome-aws-lambda'
import { analyzeUrl } from '@/lib/gemini'

async function captureScreenshot(url: string): Promise<Buffer | null> {
  let browser = null
  try {
    console.log('开始截图:', url)
    
    // 获取 Chrome 可执行文件路径
    const executablePath = await chrome.executablePath

    if (!executablePath) {
      console.error('无法获取 Chrome 可执行文件路径')
      return null
    }

    // 启动浏览器
    browser = await puppeteer.launch({
      args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chrome.defaultViewport,
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    })

    // 创建新页面
    const page = await browser.newPage()
    
    // 设置视口大小
    await page.setViewport({ width: 1280, height: 800 })
    
    // 设置请求拦截
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      const resourceType = request.resourceType()
      if (resourceType === 'image' || resourceType === 'media' || resourceType === 'font') {
        request.abort()
      } else {
        request.continue()
      }
    })

    // 导航到目标网址
    await page.goto(url, { 
      waitUntil: ['domcontentloaded', 'networkidle0'],
      timeout: 15000 
    })

    // 等待页面加载
    await page.waitForTimeout(2000)

    // 注入样式以改善截图效果
    await page.addStyleTag({
      content: `
        * { 
          transition: none !important; 
          animation: none !important;
          scroll-behavior: auto !important;
        }
        .modal, .popup, .overlay, [class*="modal"], [class*="popup"], [class*="overlay"] { 
          display: none !important; 
        }
      `
    })

    // 滚动到顶部
    await page.evaluate(() => window.scrollTo(0, 0))

    // 截图
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 1280,
        height: 800
      }
    })

    console.log('截图完成:', url)
    return screenshot as Buffer
  } catch (error) {
    console.error('截图失败:', error)
    return null
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch (error) {
        console.error('关闭浏览器失败:', error)
      }
    }
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
          // 使用 Google AI 分析网站
          const analysis = await analyzeUrl(url)
          console.log('AI 分析结果:', analysis)

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
            title: analysis.title,
            description: analysis.description,
            category: analysis.category[0],
            screenshot: screenshotAsset,
            createdAt: new Date().toISOString(),
            status: screenshotAsset ? 'active' : 'pending'
          }
          console.log('准备创建文档:', doc)
          const createdDoc = await client.create(doc)

          // 如果创建成功但没有截图，标记为待处理
          if (!screenshotAsset) {
            console.log('网站创建成功但缺少截图，标记为待处理:', createdDoc._id)
          }

          return createdDoc
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