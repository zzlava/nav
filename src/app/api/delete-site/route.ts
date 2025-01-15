import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { client } from '@/lib/sanity'

export async function DELETE(request: Request) {
  // 检查登录状态
  const cookieStore = cookies()
  const isLoggedIn = cookieStore.get('isLoggedIn')?.value === 'true'
  
  if (!isLoggedIn) {
    return NextResponse.json(
      { success: false, message: '未登录' },
      { status: 401 }
    )
  }

  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少网站ID' },
        { status: 400 }
      )
    }

    // 先获取网站信息
    const site = await client.fetch(`*[_type == "site" && _id == $id][0]`, { id })
    
    // 如果有截图，先删除截图资源
    if (site?.screenshot?.asset?._ref) {
      await client.delete(site.screenshot.asset._ref)
    }

    // 删除网站文档
    await client.delete(id)

    return NextResponse.json({
      success: true,
      message: '删除成功'
    })
  } catch (error: any) {
    console.error('删除网站失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `删除失败: ${error.message}`,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 