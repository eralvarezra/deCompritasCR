import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { testTelegramConnection } from '@/lib/telegram'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyAuth(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return false

  try {
    jwt.verify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await testTelegramConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Telegram test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to test Telegram connection'
    }, { status: 500 })
  }
}