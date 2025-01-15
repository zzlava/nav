import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export async function GET() {
  try {
    console.log('开始获取网站列表...')
    const query = `*[_type == "site"] | order(createdAt desc)`
    console.log('执行查询:', query)
    
    const sites = await client.fetch(query)
    console.log('获取到的网站列表:', sites)
    
    if (!Array.isArray(sites)) {
      console.error('获取到的数据不是数组:', sites)
      return NextResponse.json([], { status: 500 })
    }
    
    return NextResponse.json(sites)
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