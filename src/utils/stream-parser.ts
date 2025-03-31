/**
 * Utilities for parsing server-sent event (SSE) streams from OpenAI API
 */

/**
 * Parse an SSE stream from OpenAI into individual content chunks
 * @param stream - ReadableStream from the fetch response
 * @returns AsyncGenerator that yields content chunks
 */
export async function* parseOpenAIStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<string, void, unknown> {
  if (!stream) {
    console.error('Stream is null or undefined');
    return;
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let chunkCount = 0;

  try {
    console.log('Starting to read stream...');
    while (true) {
      const { value, done } = await reader.read();
      
      if (done) {
        console.log('Stream reading complete. Total chunks processed:', chunkCount);
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Last line may be incomplete, keep it in the buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            console.log('Received [DONE] marker');
            return;
          }
          
          try {
            // Make sure data is valid JSON before parsing
            if (data && data.trim() && !data.includes('undefined')) {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || '';
              
              if (content) {
                chunkCount++;
                if (chunkCount <= 2 || chunkCount % 20 === 0) {
                  console.log(`Streaming chunk ${chunkCount}: "${content.slice(0, 20)}${content.length > 20 ? '...' : ''}"`);
                }
                yield content;
              }
            } else {
              console.warn('Received potentially invalid JSON data, skipping:', data);
            }
          } catch (error) {
            console.error('Error parsing JSON from stream:', error, 'Raw data:', data);
          }
        } else {
          console.log('Unknown line format in stream:', line);
        }
      }
    }
  } catch (error) {
    console.error('Error reading from stream:', error);
  } finally {
    console.log('Releasing stream reader lock');
    reader.releaseLock();
  }
}

/**
 * Consume a stream and collect all chunks into a single string
 * @param stream - ReadableStream from the fetch response
 * @returns Promise with the complete response text
 */
export async function readStreamToCompletion(stream: ReadableStream<Uint8Array>): Promise<string> {
  let result = '';
  try {
    for await (const chunk of parseOpenAIStream(stream)) {
      result += chunk;
    }
    return result;
  } catch (error) {
    console.error('Error reading stream to completion:', error);
    return result; // Return what we've collected so far
  }
} 