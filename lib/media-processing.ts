import { createClient } from './supabase'
import OpenAI from 'openai'
import { Database } from '@/types/supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type Media = Database['public']['Tables']['media']['Row']
type Chunk = Database['public']['Tables']['chunks']['Row']

const supabaseClient = createClient()

export async function processFile(file: File, userId: string, workspaceId: string) {
  try {
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabaseClient.storage
      .from('media')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Create media record
    const { data: media, error: mediaError } = await supabaseClient
      .from('media')
      .insert({
        name: file.name,
        media_type: 'file',
        owner_id: userId,
      })
      .select()
      .single()

    if (mediaError) throw mediaError

    // Create media_workspace_mapping record
    const { error: mappingError } = await supabaseClient
      .from('media_workspace_mapping')
      .insert({
        media_id: media.id,
        workspace_id: workspaceId,
        added_by: userId,
      })

    if (mappingError) throw mappingError

    // Process file content and create chunks
    const text = await file.text()
    const chunks = splitIntoChunks(text)
    
    // Create embeddings and store chunks
    for (const chunk of chunks) {
      const embedding = await createEmbedding(chunk)
      
      const { error: chunkError } = await supabaseClient
        .from('chunks')
        .insert({
          chunk_text: chunk,
          media_id: media.id,
          embedding,
        })

      if (chunkError) throw chunkError
    }

    return media
  } catch (error) {
    console.error('Error processing file:', error)
    throw error
  }
}

export async function processImage(file: File, userId: string, workspaceId: string) {
  try {
    // Upload image to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabaseClient.storage
      .from('media')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Generate image description using OpenAI
    const imageDescription = await generateImageDescription(file)

    // Create media record
    const { data: media, error: mediaError } = await supabaseClient
      .from('media')
      .insert({
        name: file.name,
        media_type: 'image',
        owner_id: userId,
      })
      .select()
      .single()

    if (mediaError) throw mediaError

    // Create media_workspace_mapping record
    const { error: mappingError } = await supabaseClient
      .from('media_workspace_mapping')
      .insert({
        media_id: media.id,
        workspace_id: workspaceId,
        added_by: userId,
      })

    if (mappingError) throw mappingError

    // Create embedding for image description
    const embedding = await createEmbedding(imageDescription)

    // Store chunk with image description
    const { error: chunkError } = await supabaseClient
      .from('chunks')
      .insert({
        chunk_text: imageDescription,
        media_id: media.id,
        embedding,
      })

    if (chunkError) throw chunkError

    return media
  } catch (error) {
    console.error('Error processing image:', error)
    throw error
  }
}

async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  })
  return response.data[0].embedding
}

async function generateImageDescription(file: File): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this image in detail." },
          {
            type: "image_url",
            image_url: {
              url: URL.createObjectURL(file),
            },
          },
        ],
      },
    ],
    max_tokens: 500,
  })
  return response.choices[0].message.content || ''
}

function splitIntoChunks(text: string, chunkSize: number = 1000): string[] {
  const chunks: string[] = []
  let currentChunk = ''
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += ' ' + sentence
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
} 