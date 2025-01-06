import { NextResponse } from 'next/server'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, message: '用户名或密码错误' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '认证失败' },
      { status: 500 }
    )
  }
} 