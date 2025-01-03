const GEMINI_API_KEY = 'AIzaSyAjx5i1epjom5yNvQqJo3eZ9FdTKP0-1hQ'
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'

interface GeminiResponse {
  title: string
  description: string
  category: string
}

export async function analyzeUrl(url: string): Promise<GeminiResponse> {
  const prompt = `你是一个专业的网站分析助手。你的任务是分析网页内容，并提供准确的中文描述。请分析${url} 这个网站。

请严格按照以下 JSON 格式返回分析结果：
{
  "title": "网站标题（10字以内）",
  "description": "网站描述（50字以内）",
  "category": "分类（必须是以下之一：social、tech、news、tools、others）"
}

注意：
1. 标题必须简短精炼，突出网站的主要特点
2. 描述必须清晰准确，说明网站的主要功能和特色
3. 分类必须准确反映网站的性质
4. 所有内容必须使用中文
5. 必须返回合法的 JSON 格式`

  const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error('Gemini API 调用失败')
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('无效的响应格式')
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return result
    }
    throw new Error('无法解析 JSON 响应')
  } catch (error) {
    console.error('JSON 解析失败:', error)
    throw new Error('响应解析失败')
  }
} 