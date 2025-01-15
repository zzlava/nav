import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export async function GET() {
  try {
    console.log('开始获取网站列表')
    
    // 只获取未删除的网站
    const sites = await client.fetch(`*[_type == "site" && status != "deleted"] | order(createdAt desc)`)
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