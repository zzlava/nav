import { NextResponse } from 'next/server'
import chromium from 'chrome-aws-lambda'
import puppeteer, { HTTPRequest } from 'puppeteer-core'
import { client } from '@/lib/sanity'
import { analyzeUrl } from '@/lib/gemini'
import sharp from 'sharp'

let _browser: any = null;

async function getBrowser() {
  if (!_browser) {
    _browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
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
    return await sharp(imageBuffer)
      .resize(1280, 800, {
        fit: 'cover',
        position: 'top'
      })
      .modulate({
        brightness: 1.05,
        saturation: 1.1,
        hue: 0
      })
      .linear(
        1.1,
        -0.1
      )
      .jpeg({
        quality: 85,
        progressive: true,
        chromaSubsampling: '4:4:4'
      })
      .toBuffer()
  } catch (error) {
    console.error('图片处理失败:', error)
    return imageBuffer
  }
}

async function captureScreenshot(url: string, retryCount = 3): Promise<Buffer | null> {
  let browser = null;
  let attempt = 0;

  while (attempt < retryCount) {
    try {
      browser = await getBrowser();
      
      const page = await browser.newPage();
      
      await page.setViewport({
        width: 1280,
        height: 800,
        deviceScaleFactor: 1,
      });

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // 设置请求拦截
      await page.setRequestInterception(true);
      page.on('request', (request: HTTPRequest) => {
        const resourceType = request.resourceType();
        if (['media', 'font', 'websocket', 'manifest'].includes(resourceType)) {
          request.abort();
        } else if (resourceType === 'image' && !request.url().includes('favicon')) {
          request.abort();
        } else {
          request.continue();
        }
      });

      // 设置超时
      await page.setDefaultNavigationTimeout(30000);
      await page.setDefaultTimeout(30000);

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      if (!response) {
        throw new Error('页面加载失败: 无响应');
      }

      // 等待内容加载
      await page.waitForTimeout(1000);

      // 注入样式
      await page.addStyleTag({
        content: `
          * { transition: none !important; animation: none !important; }
          .modal, .popup, .overlay, [class*="modal"], [class*="popup"], [class*="overlay"] { display: none !important; }
        `
      });

      // 滚动到顶部
      await page.evaluate(() => window.scrollTo(0, 0));

      const screenshot = await page.screenshot({
        type: 'jpeg',
        quality: 90,
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width: 1280,
          height: 800
        }
      });

      const processedScreenshot = await processImage(screenshot);
      return processedScreenshot;

    } catch (error) {
      console.error(`截图失败 (尝试 ${attempt + 1}/${retryCount}):`, error);
      attempt++;
      
      if (attempt === retryCount) {
        console.error('所有截图尝试都失败了:', error);
        return null;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return null;
}

async function uploadImage(imageData: Buffer | string): Promise<any> {
  try {
    let buffer: Buffer
    
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
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

async function addSite(url: string) {
  try {
    let processedUrl = url.trim()
    if (!processedUrl.match(/^https?:\/\//i)) {
      processedUrl = `https://${processedUrl}`
    }

    try {
      new URL(processedUrl)
    } catch (error) {
      throw new Error('无效的网址格式')
    }

    const [screenshot, analysis] = await Promise.all([
      captureScreenshot(processedUrl),
      analyzeUrl(processedUrl)
    ])

    const imageAsset = await uploadImage(screenshot || FALLBACK_IMAGE)

    return await client.create({
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
      hasError: !screenshot,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('添加网站失败:', error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const { urls } = await req.json()
    if (!Array.isArray(urls) || !urls.length) {
      return NextResponse.json({ error: '请提供网址列表' }, { status: 400 })
    }

    const results = await Promise.allSettled(urls.map(url => addSite(url)))
    
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.filter(result => result.status === 'rejected').length

    return NextResponse.json({
      message: `成功添加 ${successful} 个网站，失败 ${failed} 个`,
      results: results.map((result, index) => ({
        url: urls[index],
        status: result.status,
        ...(result.status === 'rejected' ? { error: result.reason.message } : {})
      }))
    })

  } catch (error) {
    console.error('批量添加失败:', error)
    return NextResponse.json(
      { error: '添加失败，请稍后重试' },
      { status: 500 }
    )
  }
} 