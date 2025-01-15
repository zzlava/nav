import { GoogleGenerativeAI } from '@google/generative-ai'

// 检查 API Key
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.error('缺少 GEMINI_API_KEY 环境变量')
}

const genAI = new GoogleGenerativeAI(apiKey || '')

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
    3. 标题和描述必须使用中文`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('AI 分析结果:', text)

    try {
      // 尝试解析 JSON
      const parsed = JSON.parse(text)
      
      // 验证必要字段
      if (!parsed.title || !parsed.description || !Array.isArray(parsed.category)) {
        throw new Error('返回的数据格式不完整')
      }

      // 确保 category 是数组且只包含一个元素
      const category = Array.isArray(parsed.category) ? parsed.category[0] : parsed.category
      
      return {
        title: parsed.title.trim(),
        description: parsed.description.trim(),
        category: [category]
      }
    } catch (error) {
      console.error('解析 AI 响应失败:', error)
      // 返回基于 URL 的默认值
      const urlObj = new URL(url)
      return {
        title: urlObj.hostname,
        description: `这是一个网站：${url}`,
        category: ['其他']
      }
    }
  } catch (error) {
    console.error('调用 AI 分析失败:', error)
    // 返回基于 URL 的默认值
    const urlObj = new URL(url)
    return {
      title: urlObj.hostname,
      description: `这是一个网站：${url}`,
      category: ['其他']
    }
  }
}
