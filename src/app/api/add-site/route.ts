import { NextResponse } from 'next/server'
import { chromium, Route } from 'playwright'
import { client } from '@/lib/sanity'
import { analyzeUrl } from '@/lib/gemini'
import sharp from 'sharp'

let _browser: any = null;

async function getBrowser() {
  if (!_browser) {
    _browser = await chromium.launch({
      timeout: 30000,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-extensions'
      ]
    });
  }
  return _browser;
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

// 默认占位图片的 Base64 编码
const FALLBACK_IMAGE = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4MCIgaGVpZ2h0PSI4MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPuaIkeeahOWbvueJh+S4jeWPr+eUqDwvdGV4dD48L3N2Zz4=`

async function processImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // 处理原始图片
    return await sharp(imageBuffer)
      // 调整大小和格式
      .resize(1280, 800, {
        fit: 'cover',
        position: 'top'
      })
      // 轻微增强
      .modulate({
        brightness: 1.05,  // 轻微提高亮度
        saturation: 1.1,   // 轻微提高饱和度
        hue: 0            // 保持原始色调
      })
      // 增加对比度
      .linear(
        1.1,    // 对比度系数
        -0.1    // 偏移量
      )
      // 输出为高质量 JPEG
      .jpeg({
        quality: 85,
        progressive: true,
        chromaSubsampling: '4:4:4'  // 保持最佳色彩质量
      })
      .toBuffer()
  } catch (error) {
    console.error('图片处理失败:', error)
    // 如果处理失败，返回原始图片
    return imageBuffer
  }
}

async function captureScreenshot(url: string, retryCount = 3): Promise<Buffer | null> {
  let browser = null;
  let attempt = 0;

  while (attempt < retryCount) {
    try {
      browser = await getBrowser();
      
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        javaScriptEnabled: true,
        ignoreHTTPSErrors: true
      });

      const page = await context.newPage()
      
      // 设置更短的超时时间
      page.setDefaultNavigationTimeout(30000)
      page.setDefaultTimeout(30000)

      // 拦截某些资源请求以加快加载
      await page.route('**/*', (route: Route) => {
        const resourceType = route.request().resourceType()
        if (['media', 'font', 'websocket', 'manifest'].includes(resourceType)) {
          route.abort()
        } else if (resourceType === 'image' && !route.request().url().includes('favicon')) {
          // 只加载首屏图片
          route.abort()
        } else {
          route.continue()
        }
      })

      // 设置更快的加载策略
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      })

      if (!response) {
        throw new Error('页面加载失败: 无响应')
      }

      // 等待一小段时间让关键内容加载
      await page.waitForTimeout(1000)

      // 注入 CSS 以隐藏可能的弹窗
      await page.addStyleTag({
        content: `
          * { transition: none !important; animation: none !important; }
          .modal, .popup, .overlay, [class*="modal"], [class*="popup"], [class*="overlay"] { display: none !important; }
        `
      })

      // 截图前滚动到顶部
      await page.evaluate(() => window.scrollTo(0, 0))

      const screenshot = await page.screenshot({
        type: 'jpeg',
        quality: 90,
        fullPage: false,
        timeout: 10000,
        clip: {
          x: 0,
          y: 0,
          width: 1280,
          height: 800
        }
      })

      // 处理截图
      const processedScreenshot = await processImage(screenshot)
      return processedScreenshot

    } catch (error) {
      console.error(`截图失败 (尝试 ${attempt + 1}/${retryCount}):`, error)
      attempt++
      
      if (attempt === retryCount) {
        console.error('所有截图尝试都失败了:', error)
        return null
      }
      
      // 减少重试等待时间
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

async function uploadImage(imageData: Buffer | string): Promise<any> {
  try {
    let buffer: Buffer
    
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      // 如果是 Base64 图片，转换为 Buffer
      const base64Data = imageData.split(',')[1]
      buffer = Buffer.from(base64Data, 'base64')
    } else {
      buffer = imageData as Buffer
    }

    const imageAsset = await client.assets.upload('image', buffer, {
      filename: `screenshot-${Date.now()}.jpg`,
      contentType: 'image/jpeg',
    })

    return imageAsset
  } catch (error) {
    console.error('图片上传失败:', error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    // 1. 获取并验证 URL
    const { url } = await req.json()
    if (!url) {
      return NextResponse.json({ error: '请输入网址' }, { status: 400 })
    }

    // 2. 处理 URL 格式
    let processedUrl = url.trim()
    if (!processedUrl.match(/^https?:\/\//i)) {
      processedUrl = `https://${processedUrl}`
    }

    try {
      new URL(processedUrl)
    } catch (error) {
      return NextResponse.json({ error: '无效的网址格式' }, { status: 400 })
    }

    // 3. 并行处理截图和 AI 分析
    const [screenshot, analysis] = await Promise.all([
      captureScreenshot(processedUrl),
      analyzeUrl(processedUrl)
    ])

    // 4. 上传图片（使用实际截图或后备图片）
    const imageAsset = await uploadImage(screenshot || FALLBACK_IMAGE)

    // 5. 创建网站文档
    const doc = await client.create({
      _type: 'site',
      title: analysis.title,
      url: processedUrl,
      description: analysis.description,
      category: analysis.category,
      screenshot: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAsset._id
        }
      },
      hasError: !screenshot, // 标记是否使用了后备图片
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      ...doc,
      screenshotStatus: screenshot ? 'success' : 'fallback'
    })

  } catch (error) {
    console.error('添加网站失败:', error)
    return NextResponse.json(
      { error: '添加失败，请稍后重试' },
      { status: 500 }
    )
  }
} 