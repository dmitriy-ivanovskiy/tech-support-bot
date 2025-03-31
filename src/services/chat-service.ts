import { AIService, Message as AIMessage } from './ai-service';
import { nanoid } from 'nanoid';
import { parseOpenAIStream } from '@/utils/stream-parser';
import { AnalyticsService } from './analytics-service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  feedback?: 'helpful' | 'unhelpful';
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service to manage chat conversations and interact with the AI service
 */
export class ChatService {
  private aiService: AIService;
  private analyticsService: AnalyticsService;
  private activeConversation: Conversation | null = null;
  private conversations: Map<string, Conversation> = new Map();
  
  constructor() {
    this.aiService = new AIService();
    this.analyticsService = new AnalyticsService();
    
    // Make the AI service globally accessible for debugging
    if (typeof window !== 'undefined') {
      (window as any).__aiService = this.aiService;
    }
    
    this.loadConversationsFromStorage();
  }
  
  /**
   * Start a new conversation
   * @returns New conversation object
   */
  startNewConversation(): Conversation {
    const id = nanoid();
    const newConversation: Conversation = {
      id,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.conversations.set(id, newConversation);
    this.activeConversation = newConversation;
    this.saveConversationsToStorage();
    
    return newConversation;
  }
  
  /**
   * Send a message in the current conversation and get AI response
   * @param content - User message content
   * @returns Promise with AI response message
   */
  async sendMessage(content: string): Promise<ChatMessage> {
    // Ensure there's an active conversation
    if (!this.activeConversation) {
      this.startNewConversation();
    }
    
    // Add user message to conversation
    const userMessage: ChatMessage = {
      id: nanoid(),
      content,
      role: 'user',
      timestamp: Date.now(),
    };
    
    this.activeConversation!.messages.push(userMessage);
    this.activeConversation!.updatedAt = new Date();
    
    // If this is the first message, set the conversation title based on it
    if (this.activeConversation!.messages.length === 1) {
      this.activeConversation!.title = this.generateTitle(content);
    }
    
    // Format messages for AI service
    const aiMessages = this.activeConversation!.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Get AI response
    try {
      const aiResponse = await this.aiService.generateResponse(aiMessages);
      
      // Create assistant message from response
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        content: aiResponse.content,
        role: 'assistant',
        timestamp: Date.now(),
      };
      
      // Add to conversation
      this.activeConversation!.messages.push(assistantMessage);
      this.activeConversation!.updatedAt = new Date();
      
      // Save to storage
      this.saveConversationsToStorage();
      
      return assistantMessage;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
    }
  }
  
  /**
   * Send a message and stream the AI response
   * @param content - User message content
   * @param onChunk - Callback for each chunk of the streaming response
   * @returns Promise with the final AI response message
   */
  async streamMessage(content: string, onChunk: (chunk: string, messageId: string) => void): Promise<ChatMessage> {
    console.log('Starting streamMessage with content:', content);
    
    // Ensure there's an active conversation
    if (!this.activeConversation) {
      this.startNewConversation();
    }
    
    // Add user message to conversation
    const userMessage: ChatMessage = {
      id: nanoid(),
      content,
      role: 'user',
      timestamp: Date.now(),
    };
    
    this.activeConversation!.messages.push(userMessage);
    this.activeConversation!.updatedAt = new Date();
    
    // If this is the first message, set the conversation title based on it
    if (this.activeConversation!.messages.length === 1) {
      this.activeConversation!.title = this.generateTitle(content);
    }
    
    // Format messages for AI service
    const aiMessages = this.activeConversation!.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Create an assistant message with empty content initially
    const startTime = Date.now();
    const assistantMessage: ChatMessage = {
      id: nanoid(),
      content: '',
      role: 'assistant',
      timestamp: startTime,
    };
    
    console.log('Created assistant message with ID:', assistantMessage.id);
    
    // Add to conversation before we start streaming (for UI purposes)
    this.activeConversation!.messages.push(assistantMessage);
    
    try {
      console.log('Requesting streaming response...');
      // Get streaming response
      const stream = await this.aiService.generateStreamingResponse(aiMessages);
      if (!stream) {
        console.error('Failed to get streaming response - stream is null');
        throw new Error("Failed to get streaming response");
      }
      
      let fullContent = '';
      let streamHasStarted = false;
      let chunkCount = 0;
      
      // Process each chunk
      for await (const chunk of parseOpenAIStream(stream)) {
        chunkCount++;
        streamHasStarted = true;
        fullContent += chunk;
        assistantMessage.content = fullContent;
        
        // Log occasional chunks for debugging
        if (chunkCount <= 3 || chunkCount % 30 === 0) {
          console.log(`Received chunk ${chunkCount}, message length now: ${fullContent.length}`);
        }
        
        onChunk(chunk, assistantMessage.id);
      }
      
      console.log(`Streaming complete. Total chunks: ${chunkCount}, content length: ${fullContent.length}`);
      
      // If we never got any chunks but didn't throw an error, add a default message
      if (!streamHasStarted) {
        console.log('Stream had no content, adding default response');
        assistantMessage.content = "I'm here to help with your tech problem. Could you provide more details?";
        onChunk(assistantMessage.content, assistantMessage.id);
      }
      
      // Update the message timestamp to when streaming finished
      assistantMessage.timestamp = Date.now();
      
      // Save the complete message once streaming is done
      this.activeConversation!.updatedAt = new Date();
      this.saveConversationsToStorage();
      
      return assistantMessage;
    } catch (error) {
      console.error('Error in streaming message:', error);
      
      // If there was an error, update the message content to indicate the error
      assistantMessage.content = "I apologize, but I encountered an error while processing your request. Please try again.";
      assistantMessage.timestamp = Date.now();
      
      // Save the error state
      this.saveConversationsToStorage();
      
      throw error;
    }
  }
  
  /**
   * Get the active conversation
   * @returns Current active conversation or null
   */
  getActiveConversation(): Conversation | null {
    return this.activeConversation;
  }
  
  /**
   * Switch to a different conversation
   * @param id - Conversation ID to switch to
   * @returns The conversation that was switched to
   */
  switchConversation(id: string): Conversation {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw new Error(`Conversation with ID ${id} not found`);
    }
    
    this.activeConversation = conversation;
    return conversation;
  }
  
  /**
   * Get all saved conversations
   * @returns Array of all conversations
   */
  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  /**
   * Delete a conversation
   * @param id - ID of conversation to delete
   * @returns boolean indicating success
   */
  deleteConversation(id: string): boolean {
    const success = this.conversations.delete(id);
    
    // If we deleted the active conversation, set active to null
    if (this.activeConversation?.id === id) {
      this.activeConversation = null;
    }
    
    // Track deletion in analytics
    if (success) {
      this.analyticsService.trackEvent('conversation_deleted', { conversationId: id });
      // Force analytics to sync with current conversation state
      this.analyticsService.resyncWithChatData();
    }
    
    this.saveConversationsToStorage();
    return success;
  }
  
  /**
   * Load conversations from localStorage
   */
  private loadConversationsFromStorage(): void {
    try {
      // Check if running in browser environment
      if (typeof window === 'undefined') {
        return;
      }
      
      const savedData = localStorage.getItem('chatConversations');
      if (!savedData) return;
      
      const data = JSON.parse(savedData);
      
      // Convert plain objects back to Conversation objects with proper dates
      data.conversations.forEach((conv: any) => {
        const conversation: Conversation = {
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp).getTime(),
          })),
        };
        
        this.conversations.set(conversation.id, conversation);
      });
      
      // Set active conversation if there was one
      if (data.activeConversationId) {
        this.activeConversation = this.conversations.get(data.activeConversationId) || null;
      }
    } catch (error) {
      console.error('Error loading conversations from storage:', error);
      // Start fresh if there was an error
      this.conversations = new Map();
      this.activeConversation = null;
    }
  }
  
  /**
   * Save conversations to localStorage
   */
  private saveConversationsToStorage(): void {
    try {
      // Check if running in browser environment
      if (typeof window === 'undefined') {
        return;
      }
      
      const data = {
        conversations: Array.from(this.conversations.values()),
        activeConversationId: this.activeConversation?.id || null,
      };
      
      localStorage.setItem('chatConversations', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving conversations to storage:', error);
    }
  }
  
  /**
   * Generate a title for a conversation based on first message
   * @param message - First message content
   * @returns Generated title
   */
  private generateTitle(message: string): string {
    // Truncate message to reasonable length for title
    const maxLength = 30;
    if (message.length <= maxLength) {
      return message;
    }
    
    // Try to find a good cutoff point (word boundary)
    const truncated = message.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength / 2) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }
  
  /**
   * Update message feedback and save to storage
   * @param messageId - ID of the message to update
   * @param feedback - New feedback value
   * @returns Updated message if found, null otherwise
   */
  updateMessageFeedback(messageId: string, feedback: 'helpful' | 'unhelpful'): ChatMessage | null {
    // Find the message in the active conversation
    if (!this.activeConversation) return null;
    
    const messageIndex = this.activeConversation.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return null;
    
    // Update the message
    this.activeConversation.messages[messageIndex] = {
      ...this.activeConversation.messages[messageIndex],
      feedback
    };
    
    // Save to storage
    this.saveConversationsToStorage();
    
    return this.activeConversation.messages[messageIndex];
  }
} 