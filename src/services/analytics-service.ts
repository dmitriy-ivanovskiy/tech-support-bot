/**
 * Analytics service for tech support chat application
 * Tracks user interactions and chat activity
 */

export type AnalyticsEvent = {
  eventName: string;
  timestamp: Date;
  properties?: Record<string, any>;
};

export type ChatAnalyticsData = {
  sessionId: string;
  conversationCount: number;
  messageCount: number;
  averageResponseTime: number;
  topQueries: string[];
  events: AnalyticsEvent[];
  helpfulCount: number;
  unhelpfulCount: number;
  totalFeedback: number;
};

interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  timestamp: number;
  feedback?: 'helpful' | 'unhelpful';
}

interface StoredConversation {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
}

export class AnalyticsService {
  private sessionId: string = '';
  private events: AnalyticsEvent[] = [];
  private userMessageTimestamps: Map<string, Date> = new Map();
  private responseTimeSum: number = 0;
  private responseTimeCount: number = 0;
  private messageCount: number = 0;
  private conversationCount: number = 0;
  private queryCounts: Map<string, number> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.loadFromStorage();
    this.syncWithChatData();
    
    // Only generate a new session ID if one doesn't exist
    if (!this.sessionId) {
      this.sessionId = this.generateSessionId();
    }
    
    this.initialized = true;
    
    // Track session start without incrementing counts
    this.trackEvent('session_start', {
      sessionId: this.sessionId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
      darkMode: typeof window !== 'undefined' ? !!document.documentElement.classList.contains('dark') : false
    });
    
    // Setup beforeunload to save data before user leaves
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.saveToStorage());
    }
  }
  
  private generateSessionId(): string {
    return 'm8xa' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const savedData = localStorage.getItem('tech_support_analytics');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Restore all analytics data
        this.sessionId = parsedData.sessionId;
        this.messageCount = parsedData.messageCount || 0;
        this.conversationCount = parsedData.conversationCount || 0;
        this.responseTimeSum = parsedData.responseTimeSum || 0;
        this.responseTimeCount = parsedData.responseTimeCount || 0;
        this.events = parsedData.events || [];
        
        // Restore query counts
        if (parsedData.queryCounts) {
          this.queryCounts = new Map(Object.entries(parsedData.queryCounts));
        }

        // Restore user message timestamps
        if (parsedData.userMessageTimestamps) {
          this.userMessageTimestamps = new Map(
            Object.entries(parsedData.userMessageTimestamps).map(([key, value]) => [key, new Date(value as string)])
          );
        }
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  }
  
  private saveToStorage(): void {
    if (typeof window === 'undefined' || !this.initialized) return;
    
    try {
      const dataToSave = {
        lastUpdated: new Date().toISOString(),
        sessionId: this.sessionId,
        messageCount: this.messageCount,
        conversationCount: this.conversationCount,
        responseTimeSum: this.responseTimeSum,
        responseTimeCount: this.responseTimeCount,
        queryCounts: Object.fromEntries(this.queryCounts),
        events: this.events,
        userMessageTimestamps: Object.fromEntries(
          Array.from(this.userMessageTimestamps.entries()).map(([key, value]) => [key, value.toISOString()])
        )
      };
      
      localStorage.setItem('tech_support_analytics', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }
  
  private syncWithChatData(): void {
    try {
      if (typeof window === 'undefined') return;

      const chatData = localStorage.getItem('chatConversations');
      if (!chatData) return;

      const { conversations } = JSON.parse(chatData) as { conversations: StoredConversation[] };
      if (!Array.isArray(conversations)) return;

      // Reset counts before syncing
      this.messageCount = 0;
      this.conversationCount = 0; // Don't set this directly from conversations.length
      this.queryCounts.clear();
      this.responseTimeSum = 0;
      this.responseTimeCount = 0;
      
      // Clear existing feedback events
      this.events = this.events.filter(event => event.eventName !== 'message_feedback');

      // Count only active conversations and their messages
      conversations.forEach(conv => {
        // Skip if conversation is marked as deleted
        if (!conv || !conv.messages || !Array.isArray(conv.messages)) return;
        
        // Increment conversation count for valid conversations
        this.conversationCount++;
        
        // Process messages
        this.messageCount += conv.messages.length;
        
        // Process messages for queries, feedback, and response times
        for (let i = 0; i < conv.messages.length; i++) {
          const msg = conv.messages[i];
          
          // Handle user messages for queries and response times
          if (msg.role === 'user') {
            const truncatedQuery = msg.content.length > 100 
              ? msg.content.substring(0, 100).trim() 
              : msg.content.trim();
            
            if (truncatedQuery) {
              const currentCount = this.queryCounts.get(truncatedQuery) || 0;
              this.queryCounts.set(truncatedQuery, currentCount + 1);
            }

            // Calculate response time if there's a next message from assistant
            if (i + 1 < conv.messages.length && conv.messages[i + 1].role === 'assistant') {
              const nextMsg = conv.messages[i + 1];
              const responseTime = nextMsg.timestamp - msg.timestamp;
              if (responseTime > 0 && responseTime < 300000) { // Ignore response times > 5 minutes
                this.responseTimeSum += responseTime;
                this.responseTimeCount++;
                
                // Track response time event if not already tracked
                const eventExists = this.events.some(event => 
                  event.eventName === 'assistant_response' && 
                  event.properties?.messageId === nextMsg.id
                );
                
                if (!eventExists) {
                  this.trackEvent('assistant_response', {
                    messageId: nextMsg.id,
                    userMessageId: msg.id,
                    responseTime,
                    contentLength: nextMsg.content.length
                  });
                }
              }
            }
          }
          
          // Track feedback events
          if (msg.feedback) {
            const eventExists = this.events.some(event => 
              event.eventName === 'message_feedback' && 
              event.properties?.messageId === msg.id
            );
            
            if (!eventExists) {
              this.trackEvent('message_feedback', {
                messageId: msg.id,
                feedback: msg.feedback,
                conversationId: conv.id
              });
            }
          }
        }
      });

      // Save updated analytics
      this.saveToStorage();
    } catch (error) {
      console.error('Error syncing with chat data:', error);
    }
  }
  
  /**
   * Track a user message and start timing for response time calculation
   */
  trackUserMessage(messageId: string, content: string): void {
    this.messageCount++;
    this.userMessageTimestamps.set(messageId, new Date());
    
    // Track query content (truncated)
    const truncatedQuery = content.length > 100 
      ? content.substring(0, 100).trim() 
      : content.trim();
    
    if (truncatedQuery) {
      const currentCount = this.queryCounts.get(truncatedQuery) || 0;
      this.queryCounts.set(truncatedQuery, currentCount + 1);
    }
    
    this.trackEvent('user_message', {
      messageId,
      contentLength: content.length,
      // Don't store full content in analytics for privacy
      containsQuestion: content.includes('?'),
      containsCodeBlock: content.includes('```')
    });
    
    this.saveToStorage();
  }
  
  /**
   * Track an assistant response and calculate response time
   */
  trackAssistantResponse(messageId: string, userMessageId: string, contentLength: number): void {
    this.messageCount++;
    
    // Calculate response time if we have the user message timestamp
    const userMessageTime = this.userMessageTimestamps.get(userMessageId);
    if (userMessageTime) {
      const responseTime = new Date().getTime() - userMessageTime.getTime();
      if (responseTime > 0 && responseTime < 300000) { // Ignore response times > 5 minutes
        this.responseTimeSum += responseTime;
        this.responseTimeCount++;
      }
      this.userMessageTimestamps.delete(userMessageId); // Clean up
      
      this.trackEvent('assistant_response', {
        messageId,
        userMessageId,
        responseTime,
        contentLength
      });
    } else {
      this.trackEvent('assistant_response', {
        messageId,
        contentLength
      });
    }
    
    this.saveToStorage();
  }
  
  /**
   * Track a new conversation started
   */
  trackNewConversation(conversationId: string): void {
    this.conversationCount++;
    
    this.trackEvent('new_conversation', {
      conversationId
    });
    
    this.saveToStorage();
  }
  
  /**
   * Track a generic event
   */
  trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      eventName,
      timestamp: new Date(),
      properties
    };
    
    // Add event to the events array
    this.events.push(event);
    
    // Keep only the last 100 events to avoid memory issues
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
    
    // Save to storage after each event
    this.saveToStorage();
    
    // Log event in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, properties);
    }
  }
  
  /**
   * Get analytics data for reporting
   */
  getAnalyticsData(): ChatAnalyticsData {
    // Calculate feedback metrics from events
    const feedbackEvents = this.events.filter(event => event.eventName === 'message_feedback');
    const helpfulCount = feedbackEvents.filter(event => event.properties?.feedbackType === 'helpful').length;
    const unhelpfulCount = feedbackEvents.filter(event => event.properties?.feedbackType === 'unhelpful').length;
    const totalFeedback = helpfulCount + unhelpfulCount;
    
    // Calculate top queries
    const sortedQueries = Array.from(this.queryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query]) => query);
    
    return {
      sessionId: this.sessionId,
      conversationCount: this.conversationCount,
      messageCount: this.messageCount,
      averageResponseTime: this.responseTimeCount > 0 
        ? this.responseTimeSum / this.responseTimeCount 
        : 0,
      topQueries: sortedQueries,
      events: [...this.events],
      helpfulCount,
      unhelpfulCount,
      totalFeedback
    };
  }

  /**
   * Force a sync with chat data
   * Use this when chat data has changed significantly (e.g., conversation deleted)
   */
  public resyncWithChatData(): void {
    this.syncWithChatData();
  }
} 