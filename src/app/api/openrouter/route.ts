import { NextRequest, NextResponse } from 'next/server';

// Add CORS headers to all response objects
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-OpenRouter-Key, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders()
  });
}

/**
 * API route to proxy requests to OpenRouter
 * This helps avoid CORS issues when calling the OpenRouter API directly from the client
 */
export async function POST(request: NextRequest) {
  console.log('API Proxy: OpenRouter request received');
  
  try {
    // Get the request body - handle potential JSON parsing errors
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error('API Proxy: Error parsing request JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { 
          status: 400,
          headers: corsHeaders()
        }
      );
    }
    
    // Get the API key from the request header
    const apiKey = request.headers.get('X-OpenRouter-Key');
    
    if (!apiKey) {
      console.error('API Proxy: Missing OpenRouter API key in request headers');
      return NextResponse.json(
        { error: 'Missing OpenRouter API key. Please provide X-OpenRouter-Key header.' },
        { 
          status: 400,
          headers: corsHeaders()
        }
      );
    }
    
    // Log key details (safely - just first few chars)
    console.log(`API Proxy: Using API key starting with: ${apiKey.substring(0, 8)}...`);
    console.log(`API Proxy: Request for model: ${requestData.model}`);
    console.log(`API Proxy: Message count: ${requestData.messages?.length || 0}`);
    console.log(`API Proxy: Streaming request: ${!!requestData.stream}`);
    
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    console.log(`API Proxy: Forwarding request to: ${url}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://computer-support-assistant.vercel.app',
      'X-Title': 'Computer Support Assistant',
      'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://computer-support-assistant.vercel.app'
    };
    
    console.log('API Proxy: Sending request to OpenRouter with headers:', 
      Object.keys(headers).map(k => {
        if (k === 'Authorization') return `${k}: ***`;
        return `${k}: ${headers[k as keyof typeof headers]}`;
      }).join(', '));
    
    // Make the request to OpenRouter with appropriate error handling
    let openRouterResponse;
    try {
      openRouterResponse = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });
    } catch (fetchError) {
      console.error('API Proxy: Network error while contacting OpenRouter:', fetchError);
      return NextResponse.json(
        { error: 'Network error while contacting OpenRouter API', message: fetchError instanceof Error ? fetchError.message : String(fetchError) },
        { 
          status: 500,
          headers: corsHeaders()
        }
      );
    }
    
    console.log(`API Proxy: OpenRouter response received - Status: ${openRouterResponse.status} ${openRouterResponse.statusText}`);
    
    // If the response is not OK, log and return the error
    if (!openRouterResponse.ok) {
      let errorText = '';
      try {
        errorText = await openRouterResponse.text();
        console.error(`API Proxy: OpenRouter API error (${openRouterResponse.status}): ${errorText}`);
      } catch (textError) {
        console.error('API Proxy: Could not read error text from OpenRouter:', textError);
        errorText = 'Could not read error details';
      }
      
      return NextResponse.json(
        { error: `OpenRouter API error: ${openRouterResponse.statusText}`, details: errorText },
        { 
          status: openRouterResponse.status,
          headers: corsHeaders()
        }
      );
    }
    
    // For streaming responses
    if (requestData.stream) {
      console.log('API Proxy: Processing streaming response');
      
      // If no response body, that's an error
      if (!openRouterResponse.body) {
        console.error('API Proxy: No response body received from OpenRouter for streaming request');
        return NextResponse.json(
          { error: 'No response body received from OpenRouter' },
          { 
            status: 500,
            headers: corsHeaders() 
          }
        );
      }
      
      // For streaming, just pass through the response directly
      console.log('API Proxy: Forwarding streaming response directly');
      
      // Merge default streaming headers with CORS headers
      const streamHeaders = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders()
      };
      
      return new NextResponse(openRouterResponse.body, {
        headers: streamHeaders
      });
    }
    
    // For non-streaming responses, just forward the JSON
    console.log('API Proxy: Processing non-streaming response');
    
    try {
      const data = await openRouterResponse.json();
      console.log(`API Proxy: Successfully received JSON response, ID: ${data.id || 'unknown'}`);
      console.log(`API Proxy: Response contains ${data.choices?.length || 0} choices`);
      
      if (data.choices && data.choices.length > 0) {
        const contentPreview = data.choices[0].message?.content || '';
        console.log(`API Proxy: First choice content preview: ${contentPreview.substring(0, 50)}${contentPreview.length > 50 ? '...' : ''}`);
      }
      
      return NextResponse.json(data, { headers: corsHeaders() });
    } catch (error) {
      console.error('API Proxy: Error parsing JSON response:', error);
      
      // Try to get the raw text if JSON parsing failed
      try {
        const rawText = await openRouterResponse.text();
        console.error('API Proxy: Raw response text:', rawText.substring(0, 200));
        
        return NextResponse.json(
          { error: 'Failed to parse OpenRouter response as JSON', rawResponse: rawText.substring(0, 500) },
          { 
            status: 500,
            headers: corsHeaders() 
          }
        );
      } catch (textError) {
        console.error('API Proxy: Failed to get response text:', textError);
        
        return NextResponse.json(
          { error: 'Failed to parse OpenRouter response' },
          { 
            status: 500,
            headers: corsHeaders() 
          }
        );
      }
    }
  } catch (error) {
    console.error('API Proxy: Unhandled error:', error);
    
    return NextResponse.json(
      { error: 'Unhandled server error in OpenRouter proxy', message: error instanceof Error ? error.message : String(error) },
      { 
        status: 500,
        headers: corsHeaders() 
      }
    );
  }
} 