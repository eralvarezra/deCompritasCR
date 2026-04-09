import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync, readdirSync } from 'fs'
import path from 'path'

// Use absolute path since process.cwd() might not be reliable in standalone mode
const UPLOADS_DIR = '/app/public/uploads'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  console.log('[uploads] GET handler called')
  console.log('[uploads] request.url:', request.url)
  console.log('[uploads] UPLOADS_DIR:', UPLOADS_DIR)

  // Debug: Check if we can access the filesystem at all
  try {
    const files = readdirSync(UPLOADS_DIR)
    console.log('[uploads] Files in uploads:', files)
  } catch (e) {
    console.error('[uploads] Error reading uploads dir:', e)
  }

  try {
    const { filename } = await params
    console.log('[uploads] Requested filename:', filename)
    console.log('[uploads] process.cwd():', process.cwd())

    if (!filename || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const filepath = path.join(UPLOADS_DIR, filename)
    console.log('[uploads] Filepath:', filepath)
    console.log('[uploads] File exists:', existsSync(filepath))

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const buffer = await readFile(filepath)

    const ext = filename.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    }
    const contentType = contentTypes[ext || ''] || 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}