import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}

export async function POST(request: Request) {
  console.log('收到登录请求')
  
  try {
    const body = await request.json()
    console.log('请求体:', body)
    
    const { username, password } = body

    console.log('验证凭据:', { 
      providedUsername: username, 
      expectedUsername: ADMIN_USERNAME,
      passwordMatch: password === ADMIN_PASSWORD 
    })

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      console.log('验证成功，设置 cookie')
      
      // 创建响应
      const response = NextResponse.json({ 
        success: true,
        message: '登录成功'
      })

      // 设置 cookie
      response.cookies.set({
        name: 'isLoggedIn',
        value: 'true',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      })

      // 添加 CORS 头
      const origin = request.headers.get('origin') || '*'
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')

      console.log('Cookie 已设置')
      return response
    }

    console.log('验证失败：凭据不匹配')
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        message: '用户名或密码错误',
        debug: process.env.NODE_ENV === 'development' ? {
          providedUsername: username,
          expectedUsername: ADMIN_USERNAME,
          passwordMatch: password === ADMIN_PASSWORD
        } : undefined
      },
      { status: 401 }
    )

    // 添加 CORS 头
    const origin = request.headers.get('origin') || '*'
    errorResponse.headers.set('Access-Control-Allow-Origin', origin)
    errorResponse.headers.set('Access-Control-Allow-Credentials', 'true')

    return errorResponse
  } catch (error: any) {
    console.error('认证过程出错:', error)
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        message: '认证失败',
        error: process.env.NODE_ENV === 'development' ? 
          error?.message || '未知错误' : 
          undefined
      },
      { status: 500 }
    )

    // 添加 CORS 头
    const origin = request.headers.get('origin') || '*'
    errorResponse.headers.set('Access-Control-Allow-Origin', origin)
    errorResponse.headers.set('Access-Control-Allow-Credentials', 'true')

    return errorResponse
  }
} 