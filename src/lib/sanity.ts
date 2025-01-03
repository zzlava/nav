import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(client)

export function urlForImage(source: any) {
  return builder.image(source)
}

export async function fetchSites() {
  try {
    const response = await fetch('/api/sites')
    if (!response.ok) {
      throw new Error('获取网站列表失败')
    }
    return await response.json()
  } catch (error) {
    console.error('获取网站列表失败:', error)
    throw error
  }
}

// 删除单个网站
export async function deleteSite(id: string) {
  // 1. 获取网站信息
  const site = await client.fetch(`*[_type == "site" && _id == $id][0]{
    _id,
    screenshot
  }`, { id });

  if (!site) return;

  // 2. 先解除图片引用
  await client.patch(id)
    .unset(['screenshot'])
    .commit();

  // 3. 删除图片资源
  if (site.screenshot?.asset?._ref) {
    await client.delete(site.screenshot.asset._ref);
  }

  // 4. 删除网站文档
  await client.delete(id);
}

// 删除所有网站
export async function deleteAllSites() {
  // 1. 获取所有网站文档
  const sites = await client.fetch(`*[_type == "site"]{
    _id,
    screenshot
  }`);

  // 2. 对每个网站，先解除图片引用
  for (const site of sites) {
    await client.patch(site._id)
      .unset(['screenshot'])
      .commit()
      .catch(console.error);
  }

  // 3. 等待所有解除引用操作完成
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 4. 删除所有图片资源
  for (const site of sites) {
    if (site.screenshot?.asset?._ref) {
      await client.delete(site.screenshot.asset._ref)
        .catch(console.error);
    }
  }

  // 5. 删除所有网站文档
  for (const site of sites) {
    await client.delete(site._id)
      .catch(console.error);
  }

  return sites.length;
} 