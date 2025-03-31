"use client";

import React from 'react';
import Link from 'next/link';
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary-50 dark:from-secondary-900 dark:to-secondary-800">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link 
            href="/chat"
            className="mr-4 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Settings</h1>
        </div>
        
        <div className="space-y-8">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg overflow-hidden border border-secondary-200 dark:border-secondary-700">
            <div className="border-b border-secondary-200 dark:border-secondary-700">
              <nav className="flex bg-secondary-50 dark:bg-secondary-800/50">
                <button className="px-6 py-4 text-sm font-medium text-primary-600 border-b-2 border-primary-500 dark:text-primary-400 dark:border-primary-400 bg-white dark:bg-secondary-800">
                  Analytics
                </button>
              </nav>
            </div>
            
            <div className="p-8">
              <AnalyticsDashboard />
            </div>
          </div>
          
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg p-8 border border-secondary-200 dark:border-secondary-700">
            <h2 className="text-2xl font-semibold mb-6 text-secondary-900 dark:text-white">About</h2>
            <div className="space-y-4">
              <p className="text-secondary-800 dark:text-secondary-200 text-lg leading-relaxed">
                This AI Tech Support Assistant is designed to help users troubleshoot common computer problems through natural language conversation.
              </p>
              <p className="text-secondary-800 dark:text-secondary-200 text-lg leading-relaxed">
                The application integrates with OpenRouter API to access the DeepSeek R1 language model for generating helpful and accurate technical support responses.
              </p>
            </div>
            <div className="border-t border-secondary-200 dark:border-secondary-700 pt-6 mt-8">
              <p className="text-sm text-secondary-700 dark:text-secondary-400">
                Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 