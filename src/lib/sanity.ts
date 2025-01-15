import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

// 直接使用环境变量，不进行中间存储
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-06',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

// 打印配置信息（不包含敏感信息）
console.log('Sanity 配置信息:', {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  hasToken: !!process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource | undefined) {
  return builder.image(source || '')
}

// 测试 Sanity 连接
export async function testConnection() {
  try {
    console.log('开始测试 Sanity 连接...')
    // 尝试一个简单的查询
    const result = await client.fetch('*[_type == "site"][0...1]')
    console.log('Sanity 连接测试结果:', result)
    return true
  } catch (error: any) {
    console.error('Sanity 连接测试失败:', {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    })
    return false
  }
}

export async function fetchSites() {
  try {
    const sites = await client.fetch(`*[_type == "site"] | order(createdAt desc)`)
    return sites
  } catch (error) {
    console.error('获取网站列表失败:', error)
    return []
  }
}

export async function createSite(doc: any) {
  try {
    console.log('准备创建文档:', doc)
    const result = await client.create(doc)
    console.log('创建文档成功:', result)
    return result
  } catch (error: any) {
    console.error('创建文档失败:', {
      error,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    })
    throw error
  }
}

export async function deleteAllSites() {
  try {
    // 先获取所有网站文档
    const sites = await client.fetch(`*[_type == "site"]`)
    
    // 删除每个网站的截图资源
    for (const site of sites) {
      if (site.screenshot?.asset?._ref) {
        await client.delete(site.screenshot.asset._ref)
      }
    }

    // 删除所有网站文档
    const transaction = client.transaction()
    sites.forEach((site: any) => {
      transaction.delete(site._id)
    })
    await transaction.commit()

    return sites.length
  } catch (error) {
    console.error('删除所有网站失败:', error)
    throw error
  }
}
