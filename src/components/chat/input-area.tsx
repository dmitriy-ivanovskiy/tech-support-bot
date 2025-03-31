"use client";

import React, { useState, useRef, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { UploadService } from '@/services/upload-service';

interface InputAreaProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export default function InputArea({ onSendMessage, isLoading }: InputAreaProps) {
  const [inputValue, setInputValue] = useState('');
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Clear upload errors when typing
    if (uploadError) setUploadError(null);
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && !isUploading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const toggleAttachmentOptions = () => {
    setShowAttachmentOptions(!showAttachmentOptions);
  };

  const handleFileUpload = async (file: File, isImage: boolean) => {
    // Hide attachment options
    setShowAttachmentOptions(false);
    
    // Validate file before uploading
    const validationResult = UploadService.validateFile(file);
    if (!validationResult.valid) {
      setUploadError(validationResult.error || 'Invalid file');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const result = await UploadService.uploadFile(file);
      
      if (!result.success || !result.fileUrl) {
        setUploadError(result.error || 'Failed to upload file');
        return;
      }
      
      // Generate markdown for the uploaded file
      let markdownText = '';
      if (isImage) {
        markdownText = UploadService.getImageMarkdown(result.fileUrl, result.fileName || 'image');
      } else {
        markdownText = UploadService.getFileLinkMarkdown(result.fileUrl, result.fileName || 'file');
      }
      
      // Send the markdown directly as a message
      await onSendMessage(markdownText);
      
    } catch (error) {
      console.error('Error handling file upload:', error);
      setUploadError('An unexpected error occurred while uploading the file');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, isImage);
    }
    
    // Reset the file input
    e.target.value = '';
  };

  return (
    <div className="p-4 border-t border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800">
      {uploadError && (
        <div className="mb-2 p-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50 rounded-md">
          {uploadError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-end gap-2" role="form">
        <div className="relative flex-grow">
          <textarea
            className="input-field min-h-[50px] max-h-[150px] resize-none pr-10 bg-white dark:bg-secondary-800"
            placeholder={isUploading ? "Uploading file..." : "Type your question or describe your tech issue..."}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isUploading}
            rows={1}
          />
          
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-secondary-300"
            onClick={toggleAttachmentOptions}
            disabled={isLoading || isUploading}
            aria-label="Attachment options"
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
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>
          
          {/* Hidden file inputs */}
          <input 
            type="file" 
            ref={imageInputRef} 
            onChange={(e) => handleFileInputChange(e, true)} 
            className="hidden" 
            accept="image/jpeg,image/png,image/gif" 
            data-testid="image-input"
            disabled={isLoading}
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleFileInputChange(e, false)} 
            className="hidden" 
            accept="application/pdf" 
            data-testid="file-input"
            disabled={isLoading}
          />
          
          {showAttachmentOptions && (
            <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-secondary-700 rounded-md shadow-lg p-2 z-10">
              <button
                type="button"
                className="flex items-center px-3 py-2 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-600 rounded-md w-full"
                onClick={() => imageInputRef.current?.click()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Upload Image
              </button>
              <button
                type="button"
                className="flex items-center px-3 py-2 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-600 rounded-md w-full mt-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Upload PDF
              </button>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          className={`btn-primary p-2 rounded-full flex items-center justify-center min-h-[50px] min-w-[50px] ${(isLoading || isUploading || !inputValue.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading || isUploading || !inputValue.trim()}
          aria-label="Send message"
        >
          {isUploading ? (
            <svg 
              className="animate-spin h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              ></circle>
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
} 