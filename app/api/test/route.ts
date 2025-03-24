import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { action, message } = await req.json();

    switch (action) {
      case 'test':
        await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "Say 'Hello, this is a test!'" }],
        });
        return NextResponse.json({ status: 'success', message: 'OpenAI connection successful!' });

      case 'chat':
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }],
        });
        return NextResponse.json({ 
          status: 'success', 
          response: response.choices[0].message.content 
        });

      default:
        return NextResponse.json(
          { status: 'error', message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { status: 'error', message: (error as Error).message },
      { status: 500 }
    );
  }
} 