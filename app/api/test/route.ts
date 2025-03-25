import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not defined. Please set the OPENAI_API_KEY environment variable.');
    return NextResponse.json(
      { status: 'error', message: 'OpenAI API key is not defined' },
      { status: 401 }
    );
  }

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
    const err = error as any;
    if (err.response && err.response.status === 401) {
      console.error('Authentication error: Invalid OpenAI API key');
      return NextResponse.json(
        { status: 'error', message: 'Authentication error: Invalid OpenAI API key' },
        { status: 401 }
      );
    }
    console.error('OpenAI API error:', err);
    return NextResponse.json(
      { status: 'error', message: err.message },
      { status: 500 }
    );
  }
} 