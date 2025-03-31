"use client";

import { useState } from 'react';

interface WelcomeMessageProps {
  onSendExample: (example: string) => void;
}

export default function WelcomeMessage({ onSendExample }: WelcomeMessageProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const categories = [
    {
      id: 'connectivity',
      title: 'Connectivity Issues',
      examples: [
        'My Wi-Fi keeps disconnecting',
        'I can\'t connect to my Bluetooth speaker',
        'My VPN isn\'t working properly'
      ]
    },
    {
      id: 'performance',
      title: 'Device Performance',
      examples: [
        'My computer is running slow',
        'My phone battery drains quickly',
        'Apps keep crashing on my device'
      ]
    },
    {
      id: 'software',
      title: 'Software Problems',
      examples: [
        'I can\'t install the latest update',
        'How do I uninstall a program that won\'t delete?',
        'My software keeps showing error messages'
      ]
    }
  ];
  
  const toggleCategory = (categoryId: string) => {
    if (activeCategory === categoryId) {
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryId);
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6 my-6">
      <h2 className="text-2xl font-semibold mb-4 text-center text-secondary-900 dark:text-white">
        Welcome to Tech Support
      </h2>
      <p className="text-center mb-2 text-secondary-800 dark:text-secondary-100">
        I'm your AI tech support assistant. How can I help you today?
      </p>
      <p className="text-center text-sm text-secondary-600 dark:text-secondary-400 mb-6">
        You'll see my responses stream in real-time as I think through your technical issues.
      </p>
      
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
          Try asking about one of these common issues:
        </h3>
        
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="border border-secondary-200 dark:border-secondary-700 rounded-md overflow-hidden">
              <button
                className={`w-full p-3 text-left flex justify-between items-center text-secondary-900 dark:text-secondary-100 ${
                  activeCategory === category.id 
                    ? 'bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-100' 
                    : 'hover:bg-secondary-50 dark:hover:bg-secondary-700'
                }`}
                onClick={() => toggleCategory(category.id)}
              >
                <span className="font-medium">{category.title}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-secondary-600 dark:text-secondary-400 transition-transform ${activeCategory === category.id ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 9l-7 7-7-7" 
                  />
                </svg>
              </button>
              
              {activeCategory === category.id && (
                <div className="p-3 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800">
                  <ul className="space-y-2">
                    {category.examples.map((example, index) => (
                      <li key={index}>
                        <button
                          className="w-full text-left p-2 rounded text-secondary-800 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700 text-sm"
                          onClick={() => onSendExample(example)}
                        >
                          {example}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <p className="text-sm text-secondary-600 dark:text-secondary-400 text-center mt-6">
          Or just describe your technical issue in your own words!
        </p>
      </div>
    </div>
  );
} 