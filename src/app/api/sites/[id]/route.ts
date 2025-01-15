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
        
        // 查找所有引用此图片的文档
        const referringDocs = await client.fetch(
          `*[references($imageId)]._id`,
          { imageId: doc.screenshot.asset._ref }
        )
        console.log('引用此图片的文档:', referringDocs)
        
        // 创建一个事务
        const transaction = client.transaction()
        
        // 为每个引用文档创建更新操作
        for (const docId of referringDocs) {
          transaction.patch(docId, patch => patch.unset(['screenshot']))
        }
        
        // 添加删除图片资源的操作
        transaction.delete(doc.screenshot.asset._ref)
        
        // 添加删除主文档的操作
        transaction.delete(params.id)
        
        // 提交事务
        console.log('提交删除事务...')
        await transaction.commit()
        console.log('事务提交成功')
        
      } catch (error) {
        console.error('处理删除事务失败:', error)
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