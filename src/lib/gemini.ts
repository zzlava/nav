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
      "category": "分类（必须是以下之一：社交、技术、新闻、工具、其他）"
    }
    注意：
    1. 返回格式必须是合法的 JSON
    2. 如果无法访问网站，返回基于 URL 的猜测
    3. 标题和描述必须使用中文
    4. 标题不要超过20个字
    5. category 字段必须严格匹配以下值之一：社交、技术、新闻、工具、其他
    6. 不要添加任何额外的字段或注释，只返回 JSON`

    console.log('发送到 AI 的提示:', prompt)
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('AI 原始响应:', text)

    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('无效的响应格式')
      }

      const parsed = JSON.parse(jsonMatch[0])
      console.log('解析后的 JSON:', parsed)
      
      // 验证必要字段
      if (!parsed.title || !parsed.description || !parsed.category) {
        throw new Error('返回的数据格式不完整')
      }

      // 验证分类是否为允许的值
      if (!Object.keys(categoryMap).includes(parsed.category)) {
        console.error('无效的分类值:', parsed.category)
        throw new Error('无效的分类值')
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
      return {
        title: urlObj.hostname.replace(/^www\./, ''),
        description: `这是一个网站：${url}`,
        category: 'others'
      }
    }
  } catch (error) {
    console.error('调用 AI 分析失败:', error)
    // 返回基于 URL 的默认值
    const urlObj = new URL(url)
    return {
      title: urlObj.hostname.replace(/^www\./, ''),
      description: `这是一个网站：${url}`,
      category: 'others'
    }
  }
}
