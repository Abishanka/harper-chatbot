import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabaseClient = createClient();

export async function POST(req: Request) {
  try {
    const { message, userId } = await req.json()

    // Create embedding for the user's message
    const messageEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
    })

    // Find relevant chunks using vector similarity
    const { data: chunks, error: chunksError } = await supabaseClient.rpc(
      'match_chunks',
      {
        query_embedding: messageEmbedding.data[0].embedding,
        match_threshold: 0.7,
        match_count: 5,
      }
    )

    if (chunksError) throw chunksError

    // Get the media information for the chunks
    const mediaIds = [...new Set(chunks.map((chunk: any) => chunk.media_id))]
    const { data: media, error: mediaError } = await supabaseClient
      .from('media')
      .select('*')
      .in('id', mediaIds)

    if (mediaError) throw mediaError

    // Create context from chunks
    const context = chunks
      .map((chunk: any) => chunk.chunk_text)
      .join('\n\n')

    // Generate response using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant that answers questions based on the provided context. 
          Always cite the source of your information when possible. If the information is not in the context, 
          say so clearly. Here is the context:\n\n${context}`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return NextResponse.json({
      response: response.choices[0].message.content,
      sources: media,
    })
  } catch (error) {
    console.error('Error in chat route:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
} 