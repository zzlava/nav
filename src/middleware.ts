import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 这些路径需要认证
const protectedPaths = ['/admin']

// 管理员密码
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  // 检查是否是受保护的路径
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    // 如果是API请求，跳过认证
    if (pathname.startsWith('/api/')) {
      return NextResponse.next()
    }

    const authHeader = request.headers.get('authorization')

    if (!authHeader || !isValidAuth(authHeader)) {
      return new NextResponse(null, {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
      })
    }
  }

  const response = NextResponse.next()

  // 为所有响应添加 CORS 头
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  return response
}

function isValidAuth(authHeader: string): boolean {
  try {
    const [scheme, encoded] = authHeader.split(' ')

    if (!encoded || scheme !== 'Basic') {
      return false
    }

    const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
    const [username, password] = decoded.split(':')

    return password === ADMIN_PASSWORD
  } catch {
    return false
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有需要认证的路径:
     * - /admin 开头的路径
     * - /api 开头的路径
     */
    '/admin/:path*',
    '/api/:path*',
  ],
} 