import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  console.error('缺少 GEMINI_API_KEY 环境变量')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

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
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `分析这个网站 ${url}，并以 JSON 格式返回以下信息：
    {
      "title": "网站标题（不要包含 URL，使用简短的中文标题）",
      "description": "网站的中文描述（不超过100字）",
      "category": ["分类（只返回一个，可选：社交、技术、新闻、工具、其他）"]
    }
    注意：
    1. 返回格式必须是合法的 JSON
    2. 如果无法访问网站，返回基于 URL 的猜测
    3. 标题和描述必须使用中文
    4. 标题不要超过20个字
    5. 分类必须是以下之一：社交、技术、新闻、工具、其他`

    console.log('发送到 AI 的提示:', prompt)
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('AI 原始响应:', text)

    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('无法从响应中提取 JSON')
        throw new Error('无效的响应格式')
      }

      const parsed = JSON.parse(jsonMatch[0])
      console.log('解析后的 JSON:', parsed)
      
      // 验证必要字段
      if (!parsed.title || !parsed.description || !Array.isArray(parsed.category)) {
        console.error('返回的数据格式不完整:', parsed)
        throw new Error('返回的数据格式不完整')
      }

      // 确保 category 是数组且只包含一个元素
      const chineseCategory = Array.isArray(parsed.category) ? parsed.category[0] : parsed.category
      
      // 将中文分类转换为英文
      const englishCategory = categoryMap[chineseCategory] || 'others'

      const result = {
        title: parsed.title.trim().slice(0, 20),
        description: parsed.description.trim().slice(0, 100),
        category: englishCategory // 返回英文分类
      }

      console.log('最终分析结果:', result)
      return result
    } catch (error) {
      console.error('解析 AI 响应失败:', error)
      // 返回基于 URL 的默认值
      const urlObj = new URL(url)
      const defaultResult = {
        title: urlObj.hostname.replace(/^www\./, ''),
        description: `这是一个网站：${url}`,
        category: 'others'
      }
      console.log('使用默认值:', defaultResult)
      return defaultResult
    }
  } catch (error) {
    console.error('调用 AI 分析失败:', error)
    // 返回基于 URL 的默认值
    const urlObj = new URL(url)
    const defaultResult = {
      title: urlObj.hostname.replace(/^www\./, ''),
      description: `这是一个网站：${url}`,
      category: 'others'
    }
    console.log('使用默认值:', defaultResult)
    return defaultResult
  }
}
