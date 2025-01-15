import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    console.log('开始获取网站列表...')
    const query = `*[_type == "site"] | order(createdAt desc) {
      _id,
      title,
      description,
      url,
      category,
      screenshot,
      status,
      createdAt
    }`
    console.log('执行查询:', query)
    
    const sites = await client.fetch(query, undefined, {
      cache: 'no-cache',
      next: { revalidate: 0 }
    })
    console.log('获取到的网站列表:', sites)
    
    if (!Array.isArray(sites)) {
      console.error('获取到的数据不是数组:', sites)
      return NextResponse.json([], { status: 500 })
    }

    const validSites = sites.filter(site => 
      site._id && 
      site.title && 
      site.description && 
      site.url
    )
    
    const response = NextResponse.json(validSites)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response
  } catch (error: any) {
    console.error('获取网站列表失败:', {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack
    })
    return NextResponse.json(
      { error: error.message || '获取失败' },
      { status: 500 }
    )
  }
} 