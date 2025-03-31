"use client";

import { ChatMessage } from "@/services/chat-service";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "@/context/chat-context";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  // Don't render anything if there's no content
  if (!message.content) return null;

  const isAssistant = message.role === 'assistant';
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<'helpful' | 'unhelpful' | null>(message.feedback || null);
  const { handleFeedback } = useChat();
  
  const onFeedback = (type: 'helpful' | 'unhelpful') => {
    if (selectedFeedback) return; // Prevent multiple feedback submissions
    setSelectedFeedback(type);
    handleFeedback(message, type);
  };

  // Safely render markdown content
  const renderMarkdown = () => {
    if (!message.content) return null;
    
    try {
      return (
        <div className="prose dark:prose-invert max-w-none prose-pre:bg-secondary-200 prose-pre:dark:bg-secondary-700 prose-code:bg-secondary-200 prose-code:dark:bg-secondary-700 prose-code:before:content-none prose-code:after:content-none prose-img:rounded-lg prose-img:shadow-md prose-a:text-blue-500 prose-a:hover:text-blue-600 prose-a:dark:text-blue-400 prose-a:dark:hover:text-blue-300 [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:p-2 [&_td]:border [&_td]:p-2 [&_thead]:bg-secondary-50 dark:[&_thead]:bg-secondary-800">
          <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
            {message.content}
          </ReactMarkdown>
        </div>
      );
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return <div className="text-red-500">Error rendering message content</div>;
    }
  };

  return (
    <div 
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
      onMouseEnter={() => setShowFeedback(true)}
      onMouseLeave={() => setShowFeedback(false)}
    >
      <div 
        className={`
          relative max-w-[80%] rounded-lg p-4 
          ${isAssistant 
            ? 'bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white'
            : 'bg-primary-600 dark:bg-primary-700 text-white'}
        `}
      >
        {renderMarkdown()}
        
        {/* Only show timestamp and feedback after message is complete */}
        {(!isStreaming && message.content) && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-secondary-700 dark:text-secondary-400">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
            {isAssistant && (
              <div className="flex items-center gap-2">
                {selectedFeedback ? (
                  <span className={`${
                    selectedFeedback === 'helpful' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {selectedFeedback === 'helpful' ? '👍 Thanks for your feedback!' : '👎 Thanks for your feedback!'}
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => onFeedback('helpful')}
                      className="text-secondary-700 hover:text-green-500 dark:text-secondary-400 dark:hover:text-green-400 transition-colors"
                      title="Mark as helpful"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => onFeedback('unhelpful')}
                      className="text-secondary-700 hover:text-red-500 dark:text-secondary-400 dark:hover:text-red-400 transition-colors"
                      title="Mark as unhelpful"
                    >
                      👎
                    </button>
                    <span className="text-secondary-700 dark:text-secondary-400">
                      Was this helpful?
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 