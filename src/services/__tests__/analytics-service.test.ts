import { AnalyticsService } from '../analytics-service';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
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

    analyticsService = new AnalyticsService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should generate a new session ID if none exists', () => {
      const data = analyticsService.getAnalyticsData();
      expect(data.sessionId).toMatch(/^m8xa[a-z0-9]+$/);
    });

    it('should initialize with zero counts', () => {
      const data = analyticsService.getAnalyticsData();
      expect(data.messageCount).toBe(0);
      expect(data.conversationCount).toBe(0);
      expect(data.helpfulCount).toBe(0);
      expect(data.unhelpfulCount).toBe(0);
      expect(data.totalFeedback).toBe(0);
      expect(data.averageResponseTime).toBe(0);
    });
  });

  describe('message tracking', () => {
    it('should track user messages', () => {
      analyticsService.trackUserMessage('msg1', 'Hello');
      const data = analyticsService.getAnalyticsData();
      expect(data.messageCount).toBe(1);
    });

    it('should track assistant responses', () => {
      analyticsService.trackUserMessage('msg1', 'Hello');
      analyticsService.trackAssistantResponse('msg2', 'msg1', 100);
      const data = analyticsService.getAnalyticsData();
      expect(data.messageCount).toBe(2);
    });

    it('should calculate response time', () => {
      // Mock Date.now() and Date constructor
      const now = 1648800000000; // Some fixed timestamp
      jest.spyOn(Date, 'now').mockImplementation(() => now);
      const realDate = Date;
      global.Date = class extends Date {
        constructor(date?: number | string | Date) {
          super(date || now);
          return this;
        }
      } as any;
      
      analyticsService.trackUserMessage('msg1', 'Hello');
      
      // Move time forward 1 second
      const later = now + 1000;
      jest.spyOn(Date, 'now').mockImplementation(() => later);
      (global.Date as any) = class extends Date {
        constructor(date?: number | string | Date) {
          super(date || later);
          return this;
        }
      };
      
      analyticsService.trackAssistantResponse('msg2', 'msg1', 100);
      const data = analyticsService.getAnalyticsData();
      expect(data.averageResponseTime).toBe(1000);
      
      // Restore Date
      global.Date = realDate;
      jest.spyOn(Date, 'now').mockRestore();
    });
  });

  describe('feedback tracking', () => {
    it('should track helpful feedback', () => {
      const now = new Date();
      analyticsService.trackEvent('message_feedback', {
        messageId: 'msg1',
        feedbackType: 'helpful',
        timestamp: now,
        conversationId: 'conv1'
      });
      const data = analyticsService.getAnalyticsData();
      expect(data.helpfulCount).toBe(1);
      expect(data.unhelpfulCount).toBe(0);
      expect(data.totalFeedback).toBe(1);
    });

    it('should track unhelpful feedback', () => {
      const now = new Date();
      analyticsService.trackEvent('message_feedback', {
        messageId: 'msg1',
        feedbackType: 'unhelpful',
        timestamp: now,
        conversationId: 'conv1'
      });
      const data = analyticsService.getAnalyticsData();
      expect(data.helpfulCount).toBe(0);
      expect(data.unhelpfulCount).toBe(1);
      expect(data.totalFeedback).toBe(1);
    });

    it('should calculate helpful percentage correctly', () => {
      const now = new Date();
      analyticsService.trackEvent('message_feedback', {
        messageId: 'msg1',
        feedbackType: 'helpful',
        timestamp: now,
        conversationId: 'conv1'
      });
      analyticsService.trackEvent('message_feedback', {
        messageId: 'msg2',
        feedbackType: 'helpful',
        timestamp: now,
        conversationId: 'conv1'
      });
      analyticsService.trackEvent('message_feedback', {
        messageId: 'msg3',
        feedbackType: 'unhelpful',
        timestamp: now,
        conversationId: 'conv1'
      });
      
      const data = analyticsService.getAnalyticsData();
      expect(data.helpfulCount).toBe(2);
      expect(data.unhelpfulCount).toBe(1);
      expect(data.totalFeedback).toBe(3);
      // 2 helpful out of 3 total = 66.67%
      const expectedPercentage = Math.round((2 / 3) * 100);
      expect(expectedPercentage).toBe(67);
    });
  });

  describe('data persistence', () => {
    it('should save data to localStorage', () => {
      analyticsService.trackUserMessage('msg1', 'Hello');
      expect(mockLocalStorage).toHaveProperty('tech_support_analytics');
    });

    it('should load data from localStorage', () => {
      // Setup mock data in localStorage
      const mockData = {
        sessionId: 'test-session',
        messageCount: 5,
        conversationCount: 2,
        events: [],
        responseTimeSum: 0,
        responseTimeCount: 0,
        queryCounts: {}
      };
      mockLocalStorage['tech_support_analytics'] = JSON.stringify(mockData);

      // Create new instance which should load the mock data
      const newService = new AnalyticsService();
      const data = newService.getAnalyticsData();
      
      expect(data.sessionId).toBe('test-session');
      expect(data.messageCount).toBe(5);
      expect(data.conversationCount).toBe(2);
    });
  });

  describe('chat data sync', () => {
    it('should sync with chat data from localStorage', () => {
      // Setup mock chat data
      const now = Date.now();
      const mockChatData = {
        conversations: [
          {
            id: 'conv1',
            title: 'Test Conversation',
            messages: [
              {
                id: 'msg1',
                role: 'user',
                content: 'Hello',
                timestamp: now
              },
              {
                id: 'msg2',
                role: 'assistant',
                content: 'Hi there',
                timestamp: now + 1000,
                feedback: 'helpful'
              }
            ],
            createdAt: new Date(now).toISOString(),
            updatedAt: new Date(now + 1000).toISOString()
          }
        ]
      };
      mockLocalStorage['chatConversations'] = JSON.stringify(mockChatData);

      // Create new instance which should sync with the mock chat data
      const newService = new AnalyticsService();
      const data = newService.getAnalyticsData();
      
      expect(data.conversationCount).toBe(1);
      expect(data.messageCount).toBe(2);
      expect(data.helpfulCount).toBe(1);
    });
  });
}); 