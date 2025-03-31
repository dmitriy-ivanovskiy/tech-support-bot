/**
 * Service for handling file uploads in the chat application
 */

interface UploadResponse {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  error?: string;
}

export class UploadService {
  /**
   * Upload a file to the server
   * @param file - File to upload
   * @returns Promise with upload result
   */
  static async uploadFile(file: File): Promise<UploadResponse> {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Send request to upload API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      // Parse response
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to upload file',
        };
      }
      
      return data as UploadResponse;
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while uploading the file',
      };
    }
  }
  
  /**
   * Check if a file meets the upload requirements
   * @param file - File to validate
   * @returns Validation result
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        valid: false,
        error: 'File size exceeds 5MB limit',
      };
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not allowed. Please upload an image (JPEG, PNG, GIF) or PDF.',
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Generate image markdown for chat display
   * @param fileUrl - URL of the uploaded file
   * @param fileName - Original file name
   * @returns Markdown string
   */
  static getImageMarkdown(fileUrl: string, fileName: string): string {
    return `![${fileName}](${fileUrl})`;
  }
  
  /**
   * Generate file link markdown for chat display
   * @param fileUrl - URL of the uploaded file
   * @param fileName - Original file name
   * @returns Markdown string
   */
  static getFileLinkMarkdown(fileUrl: string, fileName: string): string {
    return `[${fileName}](${fileUrl})`;
  }
} 