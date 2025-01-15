import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export async function GET() {
  try {
    console.log('开始获取网站列表')
    
    // 明确指定只获取 status 不为 deleted 或 status 字段不存在的网站
    const sites = await client.fetch(
      `*[_type == "site" && (status != "deleted" || !defined(status))] | order(createdAt desc)`
    )
    console.log('获取到的网站数量:', sites.length)

    return NextResponse.json(sites)
  } catch (error) {
    console.error('获取网站列表失败:', error)
    return NextResponse.json(
      { error: '获取网站列表失败' },
      { status: 500 }
    )
  }
} 