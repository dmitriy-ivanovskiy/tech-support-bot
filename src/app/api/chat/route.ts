import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { message } = await req.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: message is required and must be a string' },
        { status: 400 }
      );
    }

    // In a real implementation, this is where you would call the Deepseek R1 API
    // For now, we'll use a simple mock response
    const mockResponse = {
      id: Date.now().toString(),
      message: `I'll help you with "${message}". This is a simulated response from the API.`,
      timestamp: new Date().toISOString(),
    };

    // Add a slight delay to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Optional: add a GET handler to retrieve conversation history if needed
export async function GET() {
  return NextResponse.json(
    {
      messages: [
        {
          id: '1',
          content: 'Hi there! I\'m your AI tech support assistant. How can I help you today?',
          role: 'assistant',
          timestamp: new Date().toISOString(),
        }
      ]
    }
  );
} 