import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: '请提供网站ID' }, { status: 400 })
    }

    // 获取网站信息以删除相关的图片资源
    const site = await client.fetch(`*[_type == "site" && _id == $id][0]`, { id })
    if (!site) {
      return NextResponse.json({ error: '网站不存在' }, { status: 404 })
    }

    // 如果有截图，删除截图资源
    if (site.screenshot?.asset?._ref) {
      await client.delete(site.screenshot.asset._ref)
    }

    // 删除网站文档
    await client.delete(id)

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除网站失败:', error)
    return NextResponse.json(
      { error: '删除失败，请稍后重试' },
      { status: 500 }
    )
  }
} 