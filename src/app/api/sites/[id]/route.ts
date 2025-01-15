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

    // 2. 如果文档有截图，处理引用关系
    if (doc.screenshot?.asset?._ref) {
      try {
        console.log('处理截图引用:', doc.screenshot.asset._ref)
        
        // 先查找所有引用此图片的文档
        const referringDocs = await client.fetch(
          `*[references($ref)]._id`,
          { ref: doc.screenshot.asset._ref }
        )
        console.log('引用此图片的文档:', referringDocs)

        // 清除所有引用
        for (const docId of referringDocs) {
          await client
            .patch(docId)
            .unset(['screenshot'])
            .commit()
          console.log(`已清除文档 ${docId} 的引用`)
        }

        // 等待一秒确保更新生效
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 删除图片资源
        await client.delete(doc.screenshot.asset._ref)
        console.log('已删除图片资源')

        // 删除主文档
        await client.delete(params.id)
        console.log('已删除主文档')

      } catch (error) {
        console.error('处理删除操作失败:', error)
        throw error
      }
    } else {
      // 如果没有截图，直接删除文档
      console.log('直接删除文档:', params.id)
      await client.delete(params.id)
    }

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