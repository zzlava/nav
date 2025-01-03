import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const sites = await client.fetch(`*[_type == "site"] | order(createdAt desc)`)
    return NextResponse.json(sites)
  } catch (error) {
    console.error('获取网站列表失败:', error)
    return NextResponse.json(
      { error: '获取失败，请稍后重试' },
      { status: 500 }
    )
  }
} 