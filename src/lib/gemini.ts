import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

export async function analyzeUrl(url: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `分析这个网站 ${url}，并以 JSON 格式返回以下信息：
    {
      "title": "网站标题",
      "description": "网站简短描述（不超过100字）",
      "category": ["网站分类，可以是：工具、资讯、社交、学习、娱乐、其他"]
    }`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    try {
      return JSON.parse(text)
    } catch (error) {
      console.error('解析 JSON 失败:', error)
      return {
        title: url,
        description: '无法获取描述',
        category: ['其他']
      }
    }
  } catch (error) {
    console.error('分析网站失败:', error)
    return {
      title: url,
      description: '无法获取描述',
      category: ['其他']
    }
  }
}
