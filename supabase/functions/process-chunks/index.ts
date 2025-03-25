// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'https://esm.sh/openai';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@1'

const openai = new OpenAI({
  // @ts-ignore
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const supabase = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL')!,
  // @ts-ignore
  Deno.env.get('SUPABASE_ANON_KEY')!
);

// Function to split text into chunks
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

// Function to process document using Docling subprocess
async function processDocumentWithDocling(filePath: string, fileType: string): Promise<string> {
  // In a real implementation, this would call a Python subprocess or API
  // that uses Docling to process the document.
  // For Supabase Edge Functions, you would need to:
  // 1. Set up a separate Python microservice with Docling
  // 2. Call that service API from this function
  // 3. Get back the processed text
  
  // For now, we'll simulate the call and response
  console.log(`Processing ${filePath} of type ${fileType} with Docling`);

  // This would be replaced with an actual API call to a Python service
  // that runs Docling. Example of what would happen:
  /*
  const response = await fetch('https://your-docling-service.com/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      filePath, 
      fileType,
      options: {
        exportFormat: 'text'
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Docling processing failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.text;
  */
  
  // For testing, we'll use a simplified approach
  // In production, create a separate Python service with Docling
  // This is a placeholder to be replaced with actual integration
  
  // For now, we'll continue using our current methods as a fallback
  if (fileType === 'pdf') {
    return "Docling would extract PDF content with advanced layout understanding";
  } else if (fileType === 'docx' || fileType === 'doc') {
    return "Docling would extract Word document content preserving structure";
  } else if (fileType === 'image') {
    return "Docling would extract text from images with OCR and understand visual content";
  } else {
    return "Docling would extract content from this file format";
  }
}

// Function to create embedding for a text chunk
async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// @ts-ignore
serve(async (req: Request) => {
  try {
    const { fileName } = await req.json();
    
    if (!fileName) {
      throw new Error('File name is required');
    }
    
    // Get file data from storage
    const { data: file, error: fileError } = await supabase.storage
      .from('media-bucket')
      .download(fileName);
    
    if (fileError) {
      throw new Error(`Failed to download file: ${fileError.message}`);
    }
    
    // Get media info from database based on filename
    const { data: mediaData, error: mediaError } = await supabase
      .from('media')
      .select('id, media_type, owner_id')
      .eq('name', fileName.split('/').pop())
      .single();
    
    if (mediaError || !mediaData) {
      throw new Error(`Failed to get media info: ${mediaError?.message || 'Media not found'}`);
    }
    
    const mediaId = mediaData.id;
    const mediaType = mediaData.media_type;
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    
    // Save file to temp location (in production, this would be handled by your Python service)
    const tempFilePath = `/tmp/${fileName.split('/').pop()}`;
    // In production, you'd need to save the file or pass it directly to your Python service
    
    // Process document using Docling
    // Note: In a real implementation, this would call a separate Python service
    let extractedText = await processDocumentWithDocling(tempFilePath, fileExt || '');
    
    // Split text into chunks
    let chunks: string[] = splitIntoChunks(extractedText);
    
    // Create embeddings and store in database
    const results = [];
    
    for (const [index, chunk] of chunks.entries()) {
      const embedding = await createEmbedding(chunk);
      
      // Store chunk and embedding in database
      const { data: chunkData, error: chunkError } = await supabase
        .from('chunks')
        .insert({
          chunk_text: chunk,
          media_id: mediaId,
          page_number: mediaType === 'file' ? index + 1 : null,
          embedding: embedding
        })
        .select('id')
        .single();
      
      if (chunkError) {
        throw new Error(`Failed to store chunk: ${chunkError.message}`);
      }
      
      results.push({
        chunkId: chunkData.id,
        pageNumber: mediaType === 'file' ? index + 1 : null
      });
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        chunks: results.length, 
        results,
        note: "Integration with Docling would require a separate Python microservice"
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in process-chunks function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to process chunks' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 