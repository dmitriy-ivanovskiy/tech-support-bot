"use client";

import { ReactNode, RefObject, useRef, useState, useEffect } from 'react';
import MessageBubble from './message-bubble';
import { ChatMessage } from '@/services/chat-service';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
  streamingMessageId?: string | null;
}

export default function ChatWindow({ messages, isLoading, messagesEndRef, streamingMessageId }: ChatWindowProps) {
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id || index}
              message={message}
              isStreaming={streamingMessageId === message.id}
            />
          ))}
          {isLoading && !streamingMessageId && (
            <div className="flex justify-start">
              <div className="bg-secondary-200 dark:bg-secondary-800 rounded-lg p-4 max-w-[80%] relative shadow-sm" data-testid="loading-indicator">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2.5 h-2.5 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-sm text-secondary-700 dark:text-secondary-300 font-medium">AI is thinking...</span>
                </div>
                <div className="mt-2 text-xs text-secondary-600 dark:text-secondary-400">
                  This might take a few seconds
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
} 