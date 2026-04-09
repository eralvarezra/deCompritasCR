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
  let filename = 'unknown'
  let debugInfo: Record<string, unknown> = {}

  try {
    const resolvedParams = await params
    filename = resolvedParams.filename

    debugInfo = {
      filename,
      cwd: process.cwd(),
      uploadsDir: UPLOADS_DIR,
    }

    if (!filename || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename', debug: debugInfo }, { status: 400 })
    }

    const filepath = path.join(UPLOADS_DIR, filename)
    debugInfo.filepath = filepath

    // Check if file exists
    const fileExists = existsSync(filepath)
    debugInfo.fileExists = fileExists

    // List files in directory
    try {
      const files = readdirSync(UPLOADS_DIR)
      debugInfo.filesInDir = files.slice(0, 20)
    } catch (e) {
      debugInfo.readdirError = String(e)
    }

    if (!fileExists) {
      return NextResponse.json({ error: 'File not found', debug: debugInfo }, { status: 404 })
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
    return NextResponse.json({ error: 'Internal server error', debug: debugInfo, details: String(error) }, { status: 500 })
  }
}