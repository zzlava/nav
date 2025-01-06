import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 只处理 /admin 路径
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 不处理登录页面
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    const isLoggedIn = request.cookies.get('isLoggedIn')
    
    // 如果未登录，重定向到登录页面
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
} 