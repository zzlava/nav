import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { client } from '@/lib/sanity'
import puppeteer from 'puppeteer-core'
import chrome from 'chrome-aws-lambda'
import { analyzeUrl } from '@/lib/gemini'

async function captureScreenshot(url: string): Promise<Buffer | null> {
  let browser = null
  let retryCount = 3
  let attempt = 0

  while (attempt < retryCount) {
    try {
      console.log(`开始截图 (尝试 ${attempt + 1}/${retryCount}):`, url)
      
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
      await page.setViewport({ 
        width: 1280, 
        height: 800,
        deviceScaleFactor: 1,
      })
      
      // 设置请求拦截
      await page.setRequestInterception(true)
      page.on('request', (request) => {
        const resourceType = request.resourceType()
        if (['media', 'font', 'websocket', 'manifest'].includes(resourceType)) {
          request.abort()
        } else if (resourceType === 'image' && !request.url().includes('favicon')) {
          request.abort()
        } else {
          request.continue()
        }
      })

      // 设置超时
      await page.setDefaultNavigationTimeout(30000)
      await page.setDefaultTimeout(30000)

      // 导航到目标网址
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
      })

      if (!response) {
        throw new Error('页面加载失败: 无响应')
      }

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
        quality: 85,
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
      console.error(`截图失败 (尝试 ${attempt + 1}/${retryCount}):`, error)
      attempt++
      
      if (attempt === retryCount) {
        console.error('所有截图尝试都失败了:', error)
        return null
      }
      
      // 等待一秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000))
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

  return null
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