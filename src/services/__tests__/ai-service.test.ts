import { AIService } from '../ai-service';
import { Message } from '../ai-service';

// Mock environment variables
const mockEnv = {
  NODE_ENV: 'test' as const,
  NEXT_PUBLIC_OPENROUTER_API_KEY: 'sk-test-key-1',
  NEXT_PUBLIC_OPENROUTER_API_KEY2: 'sk-test-key-2'
};

// Mock process.env
Object.defineProperty(process, 'env', {
  value: mockEnv,
  writable: true
});

// Mock fetch
global.fetch = jest.fn();

// Mock TextEncoder
class MockTextEncoder {
  encode(text: string): Uint8Array {
    return new Uint8Array(Buffer.from(text));
  }
}

(global as any).TextEncoder = MockTextEncoder;

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...mockEnv };
    
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
    
    // Create new instance
    aiService = new AIService();
  });

  describe('configuration', () => {
    it('should initialize with default options', () => {
      expect(aiService).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const customService = new AIService({
        temperature: 0.5,
        maxTokens: 2048,
        stream: true
      });
      expect(customService).toBeDefined();
    });

    it('should set and get system prompt', () => {
      const newPrompt = 'New system prompt';
      aiService.setSystemPrompt(newPrompt);
      expect(aiService.getSystemPrompt()).toBe(newPrompt);
    });

    it('should handle API key validation', () => {
      // Test with invalid primary key
      process.env.NEXT_PUBLIC_OPENROUTER_API_KEY = 'invalid-key';
      process.env.NEXT_PUBLIC_OPENROUTER_API_KEY2 = '';
      expect(() => new AIService()).toThrow('No valid API keys available for the AI service');

      // Test with valid backup key
      process.env.NEXT_PUBLIC_OPENROUTER_API_KEY = '';
      process.env.NEXT_PUBLIC_OPENROUTER_API_KEY2 = 'sk-test-key-2';
      const serviceWithBackup = new AIService();
      expect(serviceWithBackup).toBeDefined();
    });
  });

  describe('API communication', () => {
    it('should generate response successfully', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [{
          message: { content: 'Test response' },
          finish_reason: 'stop'
        }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const messages: Message[] = [{ role: 'user', content: 'Hello' }];
      const response = await aiService.generateResponse(messages);

      expect(response).toEqual({
        id: 'test-id',
        content: 'Test response',
        finishReason: 'stop',
        createdAt: expect.any(Date)
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const messages: Message[] = [{ role: 'user', content: 'Hello' }];
      const response = await aiService.generateResponse(messages);

      expect(response.content).toContain('technical difficulties');
      expect(response.finishReason).toBe('error');
    });

    it('should handle non-200 responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const messages: Message[] = [{ role: 'user', content: 'Hello' }];
      const response = await aiService.generateResponse(messages);

      expect(response.content).toContain('technical difficulties');
      expect(response.finishReason).toBe('error');
    });

    it('should switch to backup API key on primary key failure', async () => {
      // First request fails with 401
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        // Second request succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-id',
            choices: [{
              message: { content: 'Test response' },
              finish_reason: 'stop'
            }]
          })
        });

      const messages: Message[] = [{ role: 'user', content: 'Hello' }];
      const response = await aiService.generateResponse(messages);

      expect(response.content).toBe('Test response');
      expect(response.finishReason).toBe('stop');
    });
  });

  describe('streaming responses', () => {
    it('should generate streaming response', async () => {
      // Mock ReadableStream
      class MockReadableStream {
        private controller: any;
        private data: Uint8Array[] = [];

        constructor(init: (controller: any) => void) {
          this.controller = {
            enqueue: (chunk: Uint8Array) => this.data.push(chunk),
            close: () => {}
          };
          init(this.controller);
        }

        getReader() {
          return {
            read: async () => {
              if (this.data.length === 0) {
                return { done: true };
              }
              return { done: false, value: this.data.shift() };
            }
          };
        }
      }

      (global as any).ReadableStream = MockReadableStream;

      const mockStream = new MockReadableStream((controller) => {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Test"}}]}\n\n'));
        controller.close();
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream
      });

      const messages: Message[] = [{ role: 'user', content: 'Hello' }];
      const stream = await aiService.generateStreamingResponse(messages);

      expect(stream).toBeDefined();
    });

    it('should handle streaming errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const messages: Message[] = [{ role: 'user', content: 'Hello' }];
      const stream = await aiService.generateStreamingResponse(messages);

      expect(stream).toBeNull();
    });
  });

  describe('conversation preparation', () => {
    it('should prepare conversation with system prompt', () => {
      const messages: Message[] = [{ role: 'user', content: 'Hello' }];
      const prepared = aiService.prepareConversation(messages);

      expect(prepared).toHaveLength(2);
      expect(prepared[0].role).toBe('system');
      expect(prepared[0].content).toBe(aiService.getSystemPrompt());
      expect(prepared[1]).toEqual(messages[0]);
    });
  });
}); 