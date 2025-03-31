"use client";

import React, { useState } from 'react';
import { useAnalytics } from '@/context/analytics-context';

interface FeedbackButtonsProps {
  messageId: string;
}

export default function FeedbackButtons({ messageId }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'unhelpful' | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const { trackEvent } = useAnalytics();
  
  const handleFeedback = (type: 'helpful' | 'unhelpful') => {
    if (feedback) return; // Prevent multiple feedback submissions
    
    setFeedback(type);
    setShowThankYou(true);
    
    // Track feedback in analytics
    trackEvent('message_feedback', {
      messageId,
      feedbackType: type
    });
    
    // Hide thank you message after 3 seconds
    setTimeout(() => {
      setShowThankYou(false);
    }, 3000);
  };
  
  if (showThankYou) {
    return (
      <div className="flex items-center space-x-2 mt-2">
        <span className="text-xs text-secondary-500 dark:text-secondary-400">
          Thank you for your feedback!
        </span>
      </div>
    );
  }
  
  if (feedback) {
    return (
      <div className="flex items-center space-x-2 mt-2">
        {feedback === 'helpful' ? (
          <span className="text-green-500 dark:text-green-400 flex items-center text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            Helpful
          </span>
        ) : (
          <span className="text-red-500 dark:text-red-400 flex items-center text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
            </svg>
            Not Helpful
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-2 mt-2 opacity-50 hover:opacity-100 transition-opacity">
      <button
        onClick={() => handleFeedback('helpful')}
        className="text-secondary-500 hover:text-green-500 dark:text-secondary-400 dark:hover:text-green-400 transition-colors"
        aria-label="Mark as helpful"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
      </button>
      
      <button
        onClick={() => handleFeedback('unhelpful')}
        className="text-secondary-500 hover:text-red-500 dark:text-secondary-400 dark:hover:text-red-400 transition-colors"
        aria-label="Mark as not helpful"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
        </svg>
      </button>
      
      <span className="text-xs text-secondary-400 dark:text-secondary-500">
        Was this helpful?
      </span>
    </div>
  );
} 