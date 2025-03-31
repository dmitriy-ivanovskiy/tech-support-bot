"use client";

import React from 'react';
import { useAnalytics } from '@/context/analytics-context';
import { formatDistanceToNow } from 'date-fns';

export default function AnalyticsDashboard() {
  const { analyticsData } = useAnalytics();
  
  if (!analyticsData) {
    return (
      <div className="p-6 bg-white dark:bg-secondary-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-secondary-900 dark:text-white">Analytics Dashboard</h2>
        <p className="text-secondary-500 dark:text-secondary-400">Loading analytics data...</p>
      </div>
    );
  }
  
  const { 
    sessionId, 
    conversationCount, 
    messageCount, 
    averageResponseTime,
    topQueries,
    events,
    helpfulCount,
    unhelpfulCount,
    totalFeedback
  } = analyticsData;

  // Format average response time to be more readable
  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };
  
  // Calculate helpful percentage
  const helpfulPercentage = totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0;
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key metrics */}
        <div className="bg-secondary-50 dark:bg-secondary-700 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3 text-secondary-900 dark:text-white">Key Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-secondary-600 dark:text-secondary-300">Session ID:</span>
              <span className="font-mono text-sm text-secondary-800 dark:text-secondary-200">{sessionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600 dark:text-secondary-300">Conversations:</span>
              <span className="font-semibold text-secondary-800 dark:text-secondary-200">{conversationCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600 dark:text-secondary-300">Messages:</span>
              <span className="font-semibold text-secondary-800 dark:text-secondary-200">{messageCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600 dark:text-secondary-300">Avg. Response Time:</span>
              <span className="font-semibold text-secondary-800 dark:text-secondary-200">{formatResponseTime(averageResponseTime)}</span>
            </div>
            <div className="border-t border-secondary-200 dark:border-secondary-600 my-2"></div>
            <div className="flex justify-between">
              <span className="text-secondary-600 dark:text-secondary-300">Total Feedback:</span>
              <span className="font-semibold text-secondary-800 dark:text-secondary-200">{totalFeedback}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600 dark:text-secondary-300">Helpful Responses:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{helpfulCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600 dark:text-secondary-300">Needs Improvement:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{unhelpfulCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600 dark:text-secondary-300">Helpful Rate:</span>
              <span className="font-semibold text-secondary-800 dark:text-secondary-200">{helpfulPercentage}%</span>
            </div>
          </div>
        </div>
        
        {/* Top queries */}
        <div className="bg-secondary-50 dark:bg-secondary-700 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3 text-secondary-900 dark:text-white">Top Queries</h3>
          {topQueries.length > 0 ? (
            <ul className="space-y-2">
              {topQueries.map((query, index) => (
                <li key={index} className="text-sm truncate text-secondary-800 dark:text-secondary-200">
                  {index + 1}. {query}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-secondary-600 dark:text-secondary-400">No queries recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
} 