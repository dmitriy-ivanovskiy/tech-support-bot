import { ChatService } from '../chat-service';
import { AIService } from '../ai-service';

// Mock nanoid
let idCounter = 0;
jest.mock('nanoid', () => ({
  nanoid: () => `test-id-${idCounter++}`
}));

// Mock stream parser
jest.mock('@/utils/stream-parser', () => ({
  parseOpenAIStream: async function* (stream: any) {
    yield 'Hello';
    yield ' ';
    yield 'world';
  }
}));

// Mock the AIService
jest.mock('../ai-service', () => ({
  AIService: jest.fn().mockImplementation(() => ({
    generateStreamingResponse: jest.fn().mockImplementation(async () => ({
      getReader: () => ({
        read: async () => ({ done: true })
      })
    })),
    generateResponse: jest.fn().mockImplementation(async () => ({
      role: 'assistant',
      content: 'Hello world'
    }))
  }))
}));

describe('ChatService', () => {
  let chatService: ChatService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    idCounter = 0;
    mockLocalStorage = {};
    
    // Mock localStorage methods
    const mockGetItem = jest.spyOn(localStorage, 'getItem')
      .mockImplementation((key: string) => mockLocalStorage[key] || null);
    
    const mockSetItem = jest.spyOn(localStorage, 'setItem')
      .mockImplementation((key: string, value: string) => {
        mockLocalStorage[key] = value;
      });
    
    const mockClear = jest.spyOn(localStorage, 'clear')
      .mockImplementation(() => {
        mockLocalStorage = {};
      });

    chatService = new ChatService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('conversation management', () => {
    it('should start a new conversation', () => {
      const conversation = chatService.startNewConversation();
      expect(conversation.id).toBe('test-id-0');
      expect(conversation.messages).toHaveLength(0);
      expect(conversation.title).toBe('New Conversation');
    });

    it('should get active conversation', () => {
      const conversation = chatService.startNewConversation();
      const active = chatService.getActiveConversation();
      expect(active).toBeDefined();
      expect(active?.id).toBe('test-id-0');
    });

    it('should switch active conversation', () => {
      const conv1 = chatService.startNewConversation();
      const conv2 = chatService.startNewConversation();
      
      chatService.switchConversation(conv1.id);
      expect(chatService.getActiveConversation()?.id).toBe('test-id-0');
      
      chatService.switchConversation(conv2.id);
      expect(chatService.getActiveConversation()?.id).toBe('test-id-1');
    });

    it('should delete a conversation', async () => {
      const conv1 = chatService.startNewConversation();
      const conv2 = chatService.startNewConversation();
      
      // Switch to conv2 to make it active
      chatService.switchConversation(conv2.id);
      
      // Delete conv1
      chatService.deleteConversation(conv1.id);
      
      // Get conversations and verify
      const conversations = chatService.getAllConversations();
      expect(conversations).toHaveLength(1);
      expect(conversations[0].id).toBe('test-id-1');
    });

    it('should handle non-browser environment', () => {
      // Mock window as undefined
      const originalWindow = global.window;
      (global as any).window = undefined;
      
      // Create new instance which should handle non-browser environment
      const newService = new ChatService();
      expect(newService.getAllConversations()).toHaveLength(0);
      
      // Restore window
      (global as any).window = originalWindow;
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.getItem to throw error
      jest.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Create new instance which should handle storage error
      const newService = new ChatService();
      expect(newService.getAllConversations()).toHaveLength(0);
    });

    it('should handle invalid localStorage data', () => {
      // Set invalid JSON in localStorage
      mockLocalStorage['chatConversations'] = 'invalid json';
      
      // Create new instance which should handle invalid data
      const newService = new ChatService();
      expect(newService.getAllConversations()).toHaveLength(0);
    });

    it('should handle deleting non-existent conversation', () => {
      const result = chatService.deleteConversation('non-existent-id');
      expect(result).toBe(false);
    });

    it('should handle deleting active conversation', () => {
      const conversation = chatService.startNewConversation();
      const result = chatService.deleteConversation(conversation.id);
      expect(result).toBe(true);
      expect(chatService.getActiveConversation()).toBeNull();
    });
  });

  describe('message handling', () => {
    it('should add a user message', async () => {
      const conversation = chatService.startNewConversation();
      await chatService.sendMessage('Hello');
      
      const messages = chatService.getActiveConversation()?.messages || [];
      expect(messages).toHaveLength(2); // User message and AI response
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Hello');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toBe('Hello world');
    });

    it('should stream assistant response', async () => {
      const conversation = chatService.startNewConversation();
      const chunks: string[] = [];
      
      await chatService.streamMessage('Hello', (chunk: string) => {
        chunks.push(chunk);
      });
      
      expect(chunks).toEqual(['Hello', ' ', 'world']);
      
      const messages = chatService.getActiveConversation()?.messages || [];
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toBe('Hello world');
    });

    it('should handle message feedback', () => {
      const conversation = chatService.startNewConversation();
      const message = {
        id: 'msg1',
        role: 'assistant' as const,
        content: 'Hello',
        timestamp: Date.now()
      };
      
      conversation.messages.push(message);
      chatService.updateMessageFeedback('msg1', 'helpful');
      
      const updatedMessage = chatService.getActiveConversation()?.messages[0];
      expect(updatedMessage?.feedback).toBe('helpful');
    });

    it('should handle feedback for non-existent message', () => {
      const result = chatService.updateMessageFeedback('non-existent-id', 'helpful');
      expect(result).toBeNull();
    });

    it('should handle feedback when no active conversation', () => {
      const result = chatService.updateMessageFeedback('msg1', 'helpful');
      expect(result).toBeNull();
    });

    it('should handle feedback update for existing message', () => {
      const conversation = chatService.startNewConversation();
      const message = {
        id: 'msg1',
        role: 'assistant' as const,
        content: 'Hello',
        timestamp: Date.now()
      };
      
      conversation.messages.push(message);
      const result = chatService.updateMessageFeedback('msg1', 'helpful');
      
      expect(result).toBeDefined();
      expect(result?.feedback).toBe('helpful');
    });

    it('should handle feedback update for unhelpful response', () => {
      const conversation = chatService.startNewConversation();
      const message = {
        id: 'msg1',
        role: 'assistant' as const,
        content: 'Hello',
        timestamp: Date.now()
      };
      
      conversation.messages.push(message);
      const result = chatService.updateMessageFeedback('msg1', 'unhelpful');
      
      expect(result).toBeDefined();
      expect(result?.feedback).toBe('unhelpful');
    });
  });

  describe('data persistence', () => {
    it('should save conversations to localStorage', async () => {
      const conversation = chatService.startNewConversation();
      const message = {
        id: 'msg1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now()
      };
      
      conversation.messages.push(message);
      
      // Add a message to trigger storage save
      await chatService.sendMessage('Hello');
      
      expect(mockLocalStorage).toHaveProperty('chatConversations');
      const savedData = JSON.parse(mockLocalStorage['chatConversations']);
      expect(savedData.conversations).toHaveLength(1);
      expect(savedData.conversations[0].messages).toHaveLength(3);
    });

    it('should load conversations from localStorage', () => {
      const mockData = {
        conversations: [
          {
            id: 'conv1',
            title: 'Test Conversation',
            messages: [
              {
                id: 'msg1',
                role: 'user',
                content: 'Hello',
                timestamp: Date.now()
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        activeConversationId: 'conv1'
      };
      mockLocalStorage['chatConversations'] = JSON.stringify(mockData);

      // Create new instance which should load the mock data
      const newService = new ChatService();
      const conversations = newService.getAllConversations();
      
      expect(conversations).toHaveLength(1);
      expect(conversations[0].id).toBe('conv1');
      expect(conversations[0].messages).toHaveLength(1);
      expect(newService.getActiveConversation()?.id).toBe('conv1');
    });

    it('should handle localStorage save errors gracefully', () => {
      // Mock localStorage.setItem to throw error
      jest.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Create new conversation which should handle storage error
      const conversation = chatService.startNewConversation();
      expect(conversation).toBeDefined();
    });

    it('should handle loading conversations with invalid message data', () => {
      const mockData = {
        conversations: [
          {
            id: 'conv1',
            title: 'Test Conversation',
            messages: [
              {
                id: 'msg1',
                role: 'user',
                content: 'Hello',
                timestamp: 'invalid-date'
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        activeConversationId: 'conv1'
      };
      mockLocalStorage['chatConversations'] = JSON.stringify(mockData);

      // Create new instance which should handle invalid message data
      const newService = new ChatService();
      const conversations = newService.getAllConversations();
      
      expect(conversations).toHaveLength(1);
      expect(conversations[0].messages).toHaveLength(1);
      expect(conversations[0].messages[0].timestamp).toBeNaN();
    });
  });
}); 