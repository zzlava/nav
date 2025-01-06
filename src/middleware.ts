import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 只处理 /admin 路径，但排除 /admin/api 和 /admin/login
  if (
    request.nextUrl.pathname.startsWith('/admin') && 
    !request.nextUrl.pathname.startsWith('/admin/api') && 
    request.nextUrl.pathname !== '/admin/login'
  ) {
    const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true'
    console.log('中间件检查登录状态:', { 
      path: request.nextUrl.pathname,
      isLoggedIn, 
      cookies: request.cookies.getAll() 
    })
    
    // 如果未登录，重定向到登录页面
    if (!isLoggedIn) {
      console.log('未登录，重定向到登录页面')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    console.log('已登录，允许访问')
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
} 