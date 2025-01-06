import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 只处理 /admin 路径
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 不处理登录页面和 API 路由
    if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname.startsWith('/admin/api/')) {
      return NextResponse.next()
    }

    const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true'
    console.log('中间件检查登录状态:', { isLoggedIn, cookies: request.cookies })
    
    // 如果未登录，重定向到登录页面
    if (!isLoggedIn) {
      console.log('未登录，重定向到登录页面')
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    console.log('已登录，允许访问')
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
} 