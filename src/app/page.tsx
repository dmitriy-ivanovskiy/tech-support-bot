"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Ensure the page is mounted
    document.body.style.overflow = 'auto';
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-secondary-50 dark:bg-secondary-900 p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-center text-primary-600 dark:text-primary-400 mb-6">
          AI Tech Support Assistant
        </h1>
        
        <p className="text-xl text-center text-secondary-700 dark:text-secondary-300 mb-8">
          Get instant solutions to your technical problems with our AI-powered support assistant
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-secondary-50 dark:bg-secondary-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-secondary-800 dark:text-secondary-200">
              Instant Troubleshooting
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400">
              Describe your technical issue and get step-by-step solutions instantly, without waiting for human support
            </p>
          </div>
          
          <div className="bg-secondary-50 dark:bg-secondary-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-secondary-800 dark:text-secondary-200">
              Smart Recommendations
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400">
              Our AI understands complex problems and provides personalized recommendations based on your specific situation
            </p>
          </div>
          
          <div className="bg-secondary-50 dark:bg-secondary-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-secondary-800 dark:text-secondary-200">
              No Account Needed
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400">
              Start chatting immediately - no registration or login required to get help with your technical issues
            </p>
          </div>
          
          <div className="bg-secondary-50 dark:bg-secondary-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-secondary-800 dark:text-secondary-200">
              Always Available
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400">
              Get support 24/7, whenever and wherever you need it, without scheduling appointments or waiting on hold
            </p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button 
            onClick={() => router.push('/chat')}
            className="btn-primary py-3 px-8 text-lg font-medium text-center"
          >
            Start Chatting Now
          </button>
        </div>
      </div>
      
      <footer className="mt-12 text-center text-secondary-600 dark:text-secondary-400">
        <p>© {new Date().getFullYear()} AI Tech Support. All rights reserved.</p>
      </footer>
    </main>
  );
} 