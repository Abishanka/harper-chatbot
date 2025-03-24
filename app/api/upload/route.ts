import { NextResponse } from 'next/server'
import { processFile, processImage } from '@/lib/media-processing'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const workspaceId = formData.get('workspaceId') as string

    if (!file || !userId || !workspaceId) {
      return NextResponse.json(
        { error: 'File, userId, and workspaceId are required' },
        { status: 400 }
      )
    }

    // Check if file is an image
    const isImage = file.type.startsWith('image/')
    
    // Process the file based on its type
    const result = isImage
      ? await processImage(file, userId, workspaceId)
      : await processFile(file, userId, workspaceId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in upload route:', error)
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    )
  }
} 