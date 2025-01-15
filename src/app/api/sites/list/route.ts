import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    console.log('开始获取网站列表')
    
    // 明确指定只获取 status 不为 deleted 或 status 字段不存在的网站
    const sites = await client.fetch(
      `*[_type == "site" && (status != "deleted" || !defined(status))] | order(createdAt desc)`,
      {},
      {
        cache: 'no-store'
      }
    )
    console.log('获取到的网站数量:', sites.length)

    const response = NextResponse.json(sites)
    
    // 设置缓存控制头
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('获取网站列表失败:', error)
    return NextResponse.json(
      { error: '获取网站列表失败' },
      { status: 500 }
    )
  }
} 