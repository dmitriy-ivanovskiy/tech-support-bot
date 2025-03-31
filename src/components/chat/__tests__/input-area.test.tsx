import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InputArea from '../input-area';

// Mock UploadService
jest.mock('@/services/upload-service', () => ({
  UploadService: {
    validateFile: jest.fn(),
    uploadFile: jest.fn(),
    getImageMarkdown: jest.fn(),
    getFileLinkMarkdown: jest.fn()
  }
}));

import { UploadService } from '@/services/upload-service';

describe('InputArea', () => {
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input field and button', () => {
    render(<InputArea onSendMessage={mockOnSendMessage} isLoading={false} />);
    expect(screen.getByPlaceholderText('Type your question or describe your tech issue...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
  });

  it('handles text input and submission', async () => {
    render(<InputArea onSendMessage={mockOnSendMessage} isLoading={false} />);
    const input = screen.getByPlaceholderText('Type your question or describe your tech issue...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello');
    expect(input).toHaveValue('');
  });

  it('prevents empty message submission', () => {
    render(<InputArea onSendMessage={mockOnSendMessage} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('disables input while loading', () => {
    render(<InputArea onSendMessage={mockOnSendMessage} isLoading={true} />);
    expect(screen.getByPlaceholderText('Type your question or describe your tech issue...')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });

  it('handles Enter key for submission', () => {
    render(<InputArea onSendMessage={mockOnSendMessage} isLoading={false} />);
    const input = screen.getByPlaceholderText('Type your question or describe your tech issue...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello');
  });

  it('allows Shift+Enter for new lines', () => {
    render(<InputArea onSendMessage={mockOnSendMessage} isLoading={false} />);
    const input = screen.getByPlaceholderText('Type your question or describe your tech issue...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  describe('File Upload', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockPdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    beforeEach(() => {
      (UploadService.validateFile as jest.Mock).mockReturnValue({ valid: true });
      (UploadService.uploadFile as jest.Mock).mockResolvedValue({
        success: true,
        fileUrl: 'https://example.com/file',
        fileName: 'test.jpg'
      });
      (UploadService.getImageMarkdown as jest.Mock).mockReturnValue('![image](https://example.com/file)');
      (UploadService.getFileLinkMarkdown as jest.Mock).mockReturnValue('[test.pdf](https://example.com/file)');
    });

    it('handles image upload', async () => {
      render(<InputArea onSendMessage={mockOnSendMessage} isLoading={false} />);
      const fileInput = screen.getByTestId('image-input');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(UploadService.uploadFile).toHaveBeenCalled();
        expect(mockOnSendMessage).toHaveBeenCalledWith('![image](https://example.com/file)');
      });
    });

    it('handles PDF upload', async () => {
      render(<InputArea onSendMessage={mockOnSendMessage} isLoading={false} />);
      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, { target: { files: [mockPdfFile] } });
      
      await waitFor(() => {
        expect(UploadService.uploadFile).toHaveBeenCalled();
        expect(mockOnSendMessage).toHaveBeenCalledWith('[test.pdf](https://example.com/file)');
      });
    });

    it('handles file validation errors', async () => {
      (UploadService.validateFile as jest.Mock).mockReturnValue({ valid: false, error: 'Invalid file' });
      render(<InputArea onSendMessage={mockOnSendMessage} isLoading={false} />);
      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, { target: { files: [mockPdfFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Invalid file')).toBeInTheDocument();
      });
    });

    it('handles upload errors', async () => {
      (UploadService.uploadFile as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Upload failed'
      });
      render(<InputArea onSendMessage={mockOnSendMessage} isLoading={false} />);
      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, { target: { files: [mockPdfFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });
    });

    it('disables upload while loading', () => {
      render(<InputArea onSendMessage={mockOnSendMessage} isLoading={true} />);
      const fileInput = screen.getByTestId('file-input');
      expect(fileInput).toBeDisabled();
    });
  });
}); 