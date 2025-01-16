import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  try {
    // 从 cookies 中获取 token
    const cookieStore = cookies()
    const token = cookieStore.get('token')

    if (!token) {
      return NextResponse.json({ isLoggedIn: false })
    }

    // 验证 token
    try {
      await verifyToken(token.value)
      return NextResponse.json({ isLoggedIn: true })
    } catch (error) {
      return NextResponse.json({ isLoggedIn: false })
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
    return NextResponse.json({ isLoggedIn: false })
  }
} 