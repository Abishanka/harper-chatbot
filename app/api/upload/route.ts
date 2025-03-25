import { NextResponse } from 'next/server'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-clerk-user-id')
    const formData = await req.formData()
    const file = formData.get('file') as File
    const workspaceId = formData.get('workspaceId') as string

    if (!file || !userId || !workspaceId) {
      return NextResponse.json(
        { error: 'File, userId, and workspaceId are required' },
        { status: 400 }
      )
    }

    // Create a new FormData object for the Python service
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('owner_id', userId)

    // Upload file using the Python service
    const uploadResponse = await fetch(`${PYTHON_SERVICE_URL}/api/upload-file`, {
      method: 'POST',
      body: uploadFormData,
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to Python service')
    }

    const uploadResult = await uploadResponse.json()

    // Process the uploaded file
    const processResponse = await fetch(`${PYTHON_SERVICE_URL}/api/process-chunks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName: file.name }),
    })

    if (!processResponse.ok) {
      throw new Error('Failed to process file chunks')
    }

    const processResult = await processResponse.json()
    console.log('Chunks processed:', processResult)

    return NextResponse.json({ 
      success: true, 
      uploadResult,
      processResult
    })
  } catch (error) {
    console.error('Error in upload route:', error)
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    )
  }
} 