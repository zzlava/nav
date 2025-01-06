import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

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
      const cookieStore = cookies()
      cookieStore.set('isLoggedIn', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      })

      console.log('Cookie 已设置')
      return response
    }

    console.log('验证失败：凭据不匹配')
    return NextResponse.json(
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
  } catch (error) {
    console.error('认证过程出错:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '认证失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
} 