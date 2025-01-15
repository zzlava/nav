import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { client } from '@/lib/sanity'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('开始处理删除请求:', params.id)
  
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
    // 1. 先获取文档信息
    const doc = await client.getDocument(params.id)
    console.log('获取到的文档:', doc)

    if (!doc) {
      return NextResponse.json(
        { success: false, message: '文档不存在' },
        { status: 404 }
      )
    }

    // 2. 如果文档有截图，先解除引用关系
    if (doc.screenshot?.asset?._ref) {
      try {
        console.log('解除截图引用:', doc.screenshot.asset._ref)
        // 先更新文档，移除截图引用
        await client
          .patch(params.id)
          .unset(['screenshot'])
          .commit()
        
        // 等待一秒，确保更新生效
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 然后尝试删除图片资源
        console.log('删除截图资源:', doc.screenshot.asset._ref)
        await client.delete(doc.screenshot.asset._ref)
      } catch (error) {
        console.error('处理截图失败:', error)
        // 继续执行，不中断流程
      }
    }

    // 3. 删除文档本身
    console.log('删除文档:', params.id)
    await client.delete(params.id)

    return NextResponse.json({
      success: true,
      message: '删除成功'
    })
  } catch (error: any) {
    console.error('删除失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `删除失败: ${error.message}`,
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
} 