"use client";

import React from 'react';
import Link from 'next/link';

interface ChatHeaderProps {
  title: string;
}

export default function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800">
      <div className="flex items-center">
        <Link href="/" className="text-primary-600 hover:text-primary-700 mr-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-6 h-6"
            role="img"
            aria-label="Back arrow"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold text-secondary-800 dark:text-white">{title}</h1>
      </div>
    </div>
  );
} 