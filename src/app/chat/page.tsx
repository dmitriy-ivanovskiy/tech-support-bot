"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useChatWithToast } from '@/hooks/use-chat-with-toast';
import MessageBubble from '@/components/chat/message-bubble';
import InputArea from '@/components/chat/input-area';
import WelcomeMessage from '@/components/chat/welcome-message';
import ChatWindow from '@/components/chat/chat-window';
import ChatHeader from '@/components/chat/chat-header';

export default function ChatPage() {
  const { 
    messages, 
    isLoading, 
    streamMessage, 
    currentConversation 
  } = useChatWithToast();
  
  // Refs for managing scroll behavior
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const newestMessageRef = useRef<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  
  // Track whether user has scrolled up manually
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Consider "at bottom" if within 100px of bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAtBottomRef.current = isAtBottom;
  }, []);
  
  // Smoothly scroll to the bottom of the chat if we're already near the bottom
  const scrollToBottom = useCallback(() => {
    if (!chatContainerRef.current || !isAtBottomRef.current) return;
    
    // Small timeout to ensure DOM has updated
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  }, []);
  
  // Handle sending a new message
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    isAtBottomRef.current = true; // Reset scroll position on new message
    
    // Handle streaming chunks
    const handleChunk = (chunk: string, messageId: string) => {
      setStreamingMessageId(messageId);
      newestMessageRef.current = messageId;
      scrollToBottom();
    };
    
    await streamMessage(message, handleChunk);
  }, [streamMessage, scrollToBottom]);
  
  // When finished streaming, clear streaming ID
  useEffect(() => {
    if (!isLoading && streamingMessageId) {
      setTimeout(() => {
        setStreamingMessageId(null);
        if (isAtBottomRef.current) {
          scrollToBottom();
        }
      }, 100);
    }
  }, [isLoading, streamingMessageId, scrollToBottom]);
  
  // Add scroll event listener
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  // Scroll to bottom on new messages if we're already near the bottom
  useEffect(() => {
    if (messages.length > 0 && isAtBottomRef.current) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);
  
  // If user starts a new message, automatically bring them to the bottom
  const handleSendExample = useCallback((example: string) => {
    isAtBottomRef.current = true; // Reset scroll position on new message
    handleSendMessage(example);
  }, [handleSendMessage]);

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-white dark:bg-secondary-900">
      <ChatHeader title={currentConversation?.title || 'New Chat'} />
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-secondary-900"
      >
        {messages.length === 0 ? (
          <WelcomeMessage onSendExample={handleSendExample} />
        ) : (
          <ChatWindow 
            messages={messages} 
            isLoading={isLoading} 
            messagesEndRef={messagesEndRef}
            streamingMessageId={streamingMessageId}
          />
        )}
      </div>
      
      <InputArea 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading} 
      />
    </div>
  );
} 