import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-06',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: 'published',
  stega: false,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource | undefined) {
  return builder.image(source || '')
}

// 测试 Sanity 连接
export async function testConnection() {
  try {
    const result = await client.fetch('*[_type == "site"][0]')
    console.log('Sanity 连接测试结果:', result)
    return true
  } catch (error) {
    console.error('Sanity 连接测试失败:', error)
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
    const result = await client.create(doc)
    console.log('创建文档成功:', result)
    return result
  } catch (error) {
    console.error('创建文档失败:', error)
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
