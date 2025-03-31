"use client";

import { useChatWithToast } from "@/hooks/use-chat-with-toast";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import FolderStructure from "./folder-structure";
import { Conversation } from "@/services/chat-service";
import ThemeToggle from "@/components/ui/theme-toggle";
import { resetAppState } from "@/utils/reset-app";
import { useToast } from "@/context/toast-context";
import { useChat } from '@/context/chat-context';

export default function Sidebar() {
  const { conversations, startNewConversation, switchConversation, deleteConversation, currentConversation } = useChat();
  const { showToast } = useToast();
  const pathname = usePathname();
  const isActive = pathname === '/chat';
  const [isResetting, setIsResetting] = useState(false);
  
  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteConversation(id);
    }
  };
  
  const handleResetApp = () => {
    if (isResetting) return;
    
    try {
      setIsResetting(true);
      showToast("Resetting application...", "info");
      // Small delay to let the toast show
      setTimeout(() => {
        resetAppState();
      }, 500);
    } catch (error) {
      console.error("Error resetting app:", error);
      showToast("Error resetting application", "error");
      setIsResetting(false);
    }
  };
  
  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const groups: Record<string, Conversation[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Last Week': [],
      'This Month': [],
      'Older': []
    };
    
    conversations.forEach(conversation => {
      const date = new Date(conversation.createdAt);
      
      if (date >= today) {
        groups['Today'].push(conversation);
      } else if (date >= yesterday) {
        groups['Yesterday'].push(conversation);
      } else if (date >= thisWeekStart) {
        groups['This Week'].push(conversation);
      } else if (date >= lastWeekStart) {
        groups['Last Week'].push(conversation);
      } else if (date >= thisMonthStart) {
        groups['This Month'].push(conversation);
      } else {
        groups['Older'].push(conversation);
      }
    });
    
    // Filter out empty groups
    return Object.entries(groups)
      .filter(([_, convs]) => convs.length > 0)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, Conversation[]>);
      
  }, [conversations]);

  return (
    <div className="w-64 h-screen bg-secondary-100 dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 flex flex-col">
      <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-secondary-800 dark:text-white">Tech Support Chat</h2>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
      
      <div className="p-3">
        <button 
          onClick={startNewConversation}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" 
              clipRule="evenodd" 
            />
          </svg>
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-1">
          <h3 className="text-xs uppercase tracking-wider text-secondary-500 dark:text-secondary-400 font-semibold mb-2">
            Conversations
          </h3>
          
          {conversations.length === 0 ? (
            <p className="text-sm text-secondary-500 dark:text-secondary-400 text-center py-4">
              No conversations yet
            </p>
          ) : (
            <div className="space-y-1">
              {Object.entries(groupedConversations).map(([title, convs]) => (
                <FolderStructure
                  key={title}
                  title={title}
                  conversations={convs}
                  onSelectConversation={switchConversation}
                  activeConversationId={currentConversation?.id}
                  onDeleteConversation={handleDeleteConversation}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3 border-t border-secondary-200 dark:border-secondary-700 space-y-2">
        <Link 
          href="/settings"
          className="w-full flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 py-2 px-3"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
          Settings
        </Link>
        
        <button
          onClick={handleResetApp}
          className="w-full flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 py-2 px-3 rounded-md transition-colors"
          disabled={isResetting}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          Reset App
        </button>
        
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
            />
          </svg>
          Home
        </Link>
      </div>
    </div>
  );
} 