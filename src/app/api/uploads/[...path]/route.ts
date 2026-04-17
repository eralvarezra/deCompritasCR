import { NextRequest, NextResponse } from "next/server"
import { readFile, access } from "fs/promises"
import path from "path"

const UPLOADS_DIR = "/app/public/uploads"

// Allowed subdirectories for security
const ALLOWED_SUBDIRS = ["payment-proofs"]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: "No file specified" }, { status: 400 })
    }

    // Validate each path segment
    for (const segment of pathSegments) {
      // Check for path traversal attempts
      if (segment.includes("..") || segment.includes("/")) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 })
      }
    }

    // If single segment, it is a file in root uploads directory
    // If multiple segments, first is subdirectory, rest is filename
    const isSubdirectory = pathSegments.length > 1
    
    if (isSubdirectory && !ALLOWED_SUBDIRS.includes(pathSegments[0])) {
      return NextResponse.json({ error: "Directory not allowed" }, { status: 403 })
    }

    const filepath = path.join(UPLOADS_DIR, ...pathSegments)

    try {
      await access(filepath)
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const buffer = await readFile(filepath)

    const filename = pathSegments[pathSegments.length - 1]
    const ext = filename.split(".").pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "png": "image/png",
      "gif": "image/gif",
      "webp": "image/webp",
    }
    const contentType = contentTypes[ext || ""] || "application/octet-stream"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
