"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AnalyticsService, ChatAnalyticsData } from "@/services/analytics-service";

interface AnalyticsContextType {
  // State
  analyticsData: ChatAnalyticsData | null;
  
  // Actions
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  trackUserMessage: (messageId: string, content: string) => void;
  trackAssistantResponse: (messageId: string, userMessageId: string, contentLength: number) => void;
  trackNewConversation: (conversationId: string) => void;
}

// Create context with default values
const AnalyticsContext = createContext<AnalyticsContextType>({
  analyticsData: null,
  trackEvent: () => {},
  trackUserMessage: () => {},
  trackAssistantResponse: () => {},
  trackNewConversation: () => {},
});

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [analyticsService] = useState(() => new AnalyticsService());
  const [analyticsData, setAnalyticsData] = useState<ChatAnalyticsData | null>(null);
  
  // Update analytics data
  const updateAnalyticsData = () => {
    setAnalyticsData(analyticsService.getAnalyticsData());
  };
  
  // Update analytics data periodically and after events
  useEffect(() => {
    // Initial update
    updateAnalyticsData();
    
    // Set up periodic updates
    const intervalId = setInterval(updateAnalyticsData, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, [analyticsService]);
  
  // Track page views
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Track initial page view
      analyticsService.trackEvent('page_view', {
        path: window.location.pathname,
        referrer: document.referrer || 'direct'
      });
      
      // Set up navigation tracking
      const handleRouteChange = () => {
        analyticsService.trackEvent('page_view', {
          path: window.location.pathname,
          referrer: document.referrer || 'direct'
        });
      };
      
      // Add event listener for route changes
      window.addEventListener('popstate', handleRouteChange);
      
      return () => {
        window.removeEventListener('popstate', handleRouteChange);
      };
    }
  }, [analyticsService]);
  
  // Expose analytics functions through context
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    analyticsService.trackEvent(eventName, properties);
    // Update analytics data immediately after tracking an event
    updateAnalyticsData();
  };
  
  const trackUserMessage = (messageId: string, content: string) => {
    analyticsService.trackUserMessage(messageId, content);
    updateAnalyticsData();
  };
  
  const trackAssistantResponse = (messageId: string, userMessageId: string, contentLength: number) => {
    analyticsService.trackAssistantResponse(messageId, userMessageId, contentLength);
    updateAnalyticsData();
  };
  
  const trackNewConversation = (conversationId: string) => {
    analyticsService.trackNewConversation(conversationId);
    updateAnalyticsData();
  };
  
  return (
    <AnalyticsContext.Provider
      value={{
        analyticsData,
        trackEvent,
        trackUserMessage,
        trackAssistantResponse,
        trackNewConversation,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

// Custom hook for accessing analytics context
export const useAnalytics = () => useContext(AnalyticsContext); 