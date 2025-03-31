"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ChatService, ChatMessage, Conversation } from "@/services/chat-service";
import { useAnalytics } from "./analytics-context";

interface ChatContextType {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  currentConversation: Conversation | null;
  conversations: Conversation[];
  streamingMessageId: string | null;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  streamMessage: (content: string, onChunk: (chunk: string, messageId: string) => void) => Promise<void>;
  startNewConversation: () => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  handleFeedback: (message: ChatMessage, feedback: 'helpful' | 'unhelpful') => void;
}

// Create context with default values
const ChatContext = createContext<ChatContextType>({
  messages: [],
  isLoading: false,
  currentConversation: null,
  conversations: [],
  streamingMessageId: null,
  
  sendMessage: async () => {},
  streamMessage: async () => {},
  startNewConversation: () => {},
  switchConversation: () => {},
  deleteConversation: () => {},
  handleFeedback: () => {},
});

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [chatService] = useState(() => new ChatService());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const analytics = useAnalytics();
  
  // Initialize state from chat service
  useEffect(() => {
    // Check if there's an active conversation in the service
    const activeConversation = chatService.getActiveConversation();
    if (activeConversation) {
      setCurrentConversation(activeConversation);
      setMessages(activeConversation.messages);
    } else {
      // If no active conversation, start a new one
      const newConversation = chatService.startNewConversation();
      setCurrentConversation(newConversation);
      setMessages(newConversation.messages);
      
      // Track new conversation in analytics
      analytics.trackNewConversation(newConversation.id);
    }
    
    // Load all conversations
    setConversations(chatService.getAllConversations());
  }, [chatService, analytics]);
  
  // Send a message and get AI response
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Add user message immediately for better UX
      const userMessage: ChatMessage = {
        id: Date.now().toString(), // Temporary ID
        content,
        role: 'user',
        timestamp: Date.now(),
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Track user message in analytics
      analytics.trackUserMessage(userMessage.id, content);
      
      // Get AI response via service
      const assistantMessage = await chatService.sendMessage(content);
      
      // Track assistant response in analytics
      analytics.trackAssistantResponse(
        assistantMessage.id,
        userMessage.id,
        assistantMessage.content.length
      );
      
      // Update conversation and messages with the actual response from service
      setCurrentConversation(chatService.getActiveConversation());
      setMessages(chatService.getActiveConversation()?.messages || []);
      
      // Update conversations list
      setConversations(chatService.getAllConversations());
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: 'Sorry, there was an error processing your request. Please try again.',
        role: 'assistant',
        timestamp: Date.now(),
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      
      // Track error in analytics
      analytics.trackEvent('chat_error', {
        errorType: 'message_processing',
        errorDetails: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send a message and get streaming AI response
  const streamMessage = async (content: string, onChunk: (chunk: string, messageId: string) => void) => {
    if (!content.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Generate a unique timestamp and ID for this message interaction
      const messageTimestamp = Date.now();
      const userMessageId = `user-${messageTimestamp}`; 
      
      // Add user message immediately for better UX
      const userMessage: ChatMessage = {
        id: userMessageId,
        content,
        role: 'user',
        timestamp: messageTimestamp,
      };
      
      // Track user message in analytics
      analytics.trackUserMessage(userMessageId, content);
      
      // Update messages with the new user message
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Track streaming start
      const streamStartTime = Date.now();
      analytics.trackEvent('streaming_start', { userMessageId });

      // Get streaming AI response via service with callback to update UI
      await chatService.streamMessage(content, (chunk, messageId) => {
        setStreamingMessageId(messageId);
        onChunk(chunk, messageId);
        
        // Update the UI with each chunk
        setMessages(prevMessages => {
          const assistantMessageIndex = prevMessages.findIndex(
            msg => msg.role === 'assistant' && msg.id === messageId
          );
          
          if (assistantMessageIndex !== -1) {
            // Update existing message
            const updatedMessages = [...prevMessages];
            updatedMessages[assistantMessageIndex] = {
              ...updatedMessages[assistantMessageIndex],
              content: updatedMessages[assistantMessageIndex].content + chunk
            };
            return updatedMessages;
          } else {
            // Only add new assistant message if we have content
            if (!chunk.trim()) return prevMessages;
            
            return [
              ...prevMessages,
              {
                id: messageId,
                content: chunk,
                role: 'assistant',
                timestamp: Date.now(),
              }
            ];
          }
        });
      });
      
      // Track streaming end
      const streamEndTime = Date.now();
      analytics.trackEvent('streaming_end', {
        userMessageId,
        duration: streamEndTime - streamStartTime
      });
      
      // Update conversation and messages with the final state from service
      setCurrentConversation(chatService.getActiveConversation());
      setMessages(chatService.getActiveConversation()?.messages || []);
      
      // Update conversations list
      setConversations(chatService.getAllConversations());
    } catch (error) {
      console.error('Error streaming message:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: 'Sorry, there was an error processing your request. Please try again.',
        role: 'assistant',
        timestamp: Date.now(),
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      
      // Track error in analytics
      analytics.trackEvent('chat_error', {
        errorType: 'streaming_error',
        errorDetails: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };
  
  // Start a new conversation
  const startNewConversation = () => {
    const newConversation = chatService.startNewConversation();
    setCurrentConversation(newConversation);
    setMessages(newConversation.messages);
    setConversations(chatService.getAllConversations());
    
    // Track new conversation in analytics
    analytics.trackNewConversation(newConversation.id);
  };
  
  // Switch to a different conversation
  const switchConversation = (id: string) => {
    const conversation = chatService.switchConversation(id);
    if (conversation) {
      setCurrentConversation(conversation);
      setMessages(conversation.messages);
      
      // Track conversation switch in analytics
      analytics.trackEvent('conversation_switch', { conversationId: id });
    }
  };
  
  // Delete a conversation
  const deleteConversation = (id: string) => {
    chatService.deleteConversation(id);
    setConversations(chatService.getAllConversations());
    
    // If we deleted the active conversation, start a new one
    if (currentConversation?.id === id) {
      startNewConversation();
    }
    
    // Track conversation deletion in analytics
    analytics.trackEvent('conversation_delete', { conversationId: id });
  };
  
  // Handle feedback for a message
  const handleFeedback = (message: ChatMessage, feedback: 'helpful' | 'unhelpful') => {
    // Update message in chat service
    const updatedMessage = chatService.updateMessageFeedback(message.id, feedback);
    if (!updatedMessage) {
      console.error('Failed to update message feedback');
      return;
    }

    // Update UI state
    setCurrentConversation(chatService.getActiveConversation());
    setMessages(chatService.getActiveConversation()?.messages || []);
    
    // Track feedback in analytics
    analytics.trackEvent('message_feedback', {
      messageId: message.id,
      feedbackType: feedback,
      conversationId: currentConversation?.id,
      timestamp: updatedMessage.timestamp
    });
  };
  
  return (
    <ChatContext.Provider value={{
      messages,
      isLoading,
      currentConversation,
      conversations,
      streamingMessageId,
      sendMessage,
      streamMessage,
      startNewConversation,
      switchConversation,
      deleteConversation,
      handleFeedback,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext); 