import { GoogleGenerativeAI } from '@google/generative-ai'

// 检查环境变量
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
if (!apiKey) {
  console.error('缺少 GEMINI_API_KEY 或 GOOGLE_AI_API_KEY 环境变量')
}

const genAI = new GoogleGenerativeAI(apiKey || '')

// 分类映射表
const categoryMap: Record<string, string> = {
  '社交': 'social',
  '技术': 'tech',
  '新闻': 'news',
  '工具': 'tools',
  '其他': 'others'
}

export async function analyzeUrl(url: string) {
  try {
    console.log('开始分析网站:', url)
    console.log('API Key 状态:', {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasGoogleKey: !!process.env.GOOGLE_AI_API_KEY,
      finalKey: !!apiKey
    })
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `你是一个专业的网站分析助手。请分析这个网站：${url}

请根据网站的域名和URL结构，推测其主要功能和特点，并以JSON格式返回以下信息：

{
  "title": "网站名称（使用简短的中文标题，不超过10个字）",
  "description": "网站描述（使用简洁的中文，说明网站的主要功能和特点，不超过50字）",
  "category": "分类（必须严格是以下之一：社交、技术、新闻、工具、其他）"
}

注意事项：
1. 即使无法访问网站，也要根据域名和URL特征给出合理推测
2. 标题要简短有力，突出网站特点
3. 描述要具体实用，说明网站用途
4. 分类必须严格匹配指定选项
5. 返回格式必须是合法的JSON，不要添加任何其他内容`

    console.log('发送到 AI 的提示:', prompt)
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('AI 原始响应:', text)

    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('无法从响应中提取 JSON:', text)
        throw new Error('无效的响应格式')
      }

      const parsed = JSON.parse(jsonMatch[0])
      console.log('解析后的 JSON:', parsed)
      
      // 验证必要字段
      if (!parsed.title || !parsed.description || !parsed.category) {
        console.error('返回的数据不完整:', parsed)
        throw new Error('返回的数据格式不完整')
      }

      // 验证分类是否为允许的值
      if (!Object.keys(categoryMap).includes(parsed.category)) {
        console.error('无效的分类值:', parsed.category)
        // 如果分类无效，使用"其他"作为默认分类
        parsed.category = '其他'
      }

      // 将中文分类转换为英文
      const englishCategory = categoryMap[parsed.category]
      if (!englishCategory) {
        throw new Error('无法映射分类值')
      }

      const result = {
        title: parsed.title.trim().slice(0, 20),
        description: parsed.description.trim().slice(0, 100),
        category: englishCategory
      }

      console.log('最终分析结果:', result)
      return result
    } catch (error) {
      console.error('解析 AI 响应失败:', error)
      // 返回基于 URL 的默认值
      const urlObj = new URL(url)
      const domain = urlObj.hostname.replace(/^www\./, '')
      return {
        title: domain.split('.')[0],
        description: `${domain} - 这是一个网站，提供在线服务和内容。`,
        category: 'others'
      }
    }
  } catch (error) {
    console.error('调用 AI 分析失败:', error)
    // 返回基于 URL 的默认值
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname.replace(/^www\./, '')
      return {
        title: domain.split('.')[0],
        description: `${domain} - 这是一个网站，提供在线服务和内容。`,
        category: 'others'
      }
    } catch (e) {
      // 如果 URL 解析也失败，返回最基本的信息
      return {
        title: url.slice(0, 20),
        description: `这是一个网站：${url}`,
        category: 'others'
      }
    }
  }
}
