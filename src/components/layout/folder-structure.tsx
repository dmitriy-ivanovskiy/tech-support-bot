"use client";

import { useState } from 'react';
import { Conversation } from '@/services/chat-service';

interface FolderProps {
  title: string;
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  activeConversationId: string | undefined;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
}

export default function FolderStructure({ 
  title, 
  conversations, 
  onSelectConversation, 
  activeConversationId,
  onDeleteConversation
}: FolderProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const toggleFolder = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="mb-2">
      <div 
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-md"
        onClick={toggleFolder}
      >
        <div className="flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 text-secondary-600 dark:text-secondary-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
          <span className="ml-2 text-sm font-medium text-secondary-900 dark:text-secondary-100">{title}</span>
        </div>
        <span className="text-xs text-secondary-500 dark:text-secondary-400">
          {conversations.length}
        </span>
      </div>
      
      {isOpen && (
        <div className="ml-4 pl-2 border-l border-secondary-200 dark:border-secondary-700">
          {conversations.map((conversation) => (
            <div 
              key={conversation.id}
              className={`
                flex items-center justify-between p-2 my-1 rounded-md cursor-pointer
                ${conversation.id === activeConversationId 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100' 
                  : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-800 dark:text-secondary-200'}
              `}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-center truncate">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-2 text-secondary-500 dark:text-secondary-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg>
                <span className="text-sm truncate">{conversation.title}</span>
              </div>
              <button
                onClick={(e) => onDeleteConversation(e, conversation.id)}
                className="text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-secondary-300"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 