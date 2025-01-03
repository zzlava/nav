interface AnalysisResult {
  title: string
  description: string
  category: 'tools' | 'resources' | 'learning' | 'others'
}

export async function analyzeWithLLM(
  url: string,
  pageTitle: string,
  pageDescription: string
): Promise<AnalysisResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个网站分析助手，需要根据提供的网站信息生成简短的标题、描述和分类。'
          },
          {
            role: 'user',
            content: `请分析这个网站：
              URL: ${url}
              标题: ${pageTitle}
              描述: ${pageDescription}
              
              请用JSON格式返回以下信息：
              1. title: 简短的中文标题（不超过20字）
              2. description: 简短的中文描述（不超过50字）
              3. category: 分类（必须是以下之一：tools, resources, learning, others）`
          }
        ]
      })
    })

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)

    return {
      title: result.title,
      description: result.description,
      category: result.category
    }
  } catch (error) {
    console.error('LLM分析失败:', error)
    // 返回默认值
    return {
      title: pageTitle || url,
      description: pageDescription || '暂无描述',
      category: 'others'
    }
  }
} 