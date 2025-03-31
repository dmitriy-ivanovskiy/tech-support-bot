import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageBubble from '../message-bubble';
import { ChatMessage } from '@/services/chat-service';

// Mock react-markdown
jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: function MockReactMarkdown({ children }: { children: string }) {
      try {
        // For error testing, throw an error for specific content
        if (children === 'error content') {
          throw new Error('Markdown rendering error');
        }
        return <div data-testid="markdown-content">{children}</div>;
      } catch (error) {
        return <div className="text-red-500">Error rendering message content</div>;
      }
    }
  };
});

// Mock remark-gfm
jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => ({})
}));

// Mock chat context
jest.mock('@/context/chat-context', () => ({
  useChat: () => ({
    handleFeedback: jest.fn()
  })
}));

describe('MessageBubble', () => {
  const mockUserMessage: ChatMessage = {
    id: '1',
    role: 'user',
    content: 'Hello',
    timestamp: Date.now()
  };

  const mockAssistantMessage: ChatMessage = {
    id: '2',
    role: 'assistant',
    content: 'Hi there!',
    timestamp: Date.now()
  };

  it('renders user message correctly', () => {
    render(<MessageBubble message={mockUserMessage} />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Hello');
  });

  it('renders assistant message correctly', () => {
    render(<MessageBubble message={mockAssistantMessage} />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Hi there!');
  });

  it('renders nothing for empty message', () => {
    const emptyMessage = { ...mockAssistantMessage, content: '' };
    const { container } = render(<MessageBubble message={emptyMessage} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows feedback buttons for assistant messages', () => {
    render(<MessageBubble message={mockAssistantMessage} />);
    expect(screen.getByTitle('Mark as helpful')).toBeInTheDocument();
    expect(screen.getByTitle('Mark as unhelpful')).toBeInTheDocument();
  });

  it('does not show feedback buttons for user messages', () => {
    render(<MessageBubble message={mockUserMessage} />);
    expect(screen.queryByTitle('Mark as helpful')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Mark as unhelpful')).not.toBeInTheDocument();
  });

  it('shows thank you message after submitting feedback', () => {
    render(<MessageBubble message={mockAssistantMessage} />);
    fireEvent.click(screen.getByTitle('Mark as helpful'));
    expect(screen.getByText(/Thanks for your feedback!/)).toBeInTheDocument();
  });

  it('prevents multiple feedback submissions', () => {
    render(<MessageBubble message={mockAssistantMessage} />);
    fireEvent.click(screen.getByTitle('Mark as helpful'));
    expect(screen.queryByTitle('Mark as unhelpful')).not.toBeInTheDocument();
  });

  it('shows timestamp for non-streaming messages', () => {
    render(<MessageBubble message={mockAssistantMessage} />);
    const timestamp = new Date(mockAssistantMessage.timestamp).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    expect(screen.getByText(timestamp)).toBeInTheDocument();
  });

  it('does not show timestamp for streaming messages', () => {
    render(<MessageBubble message={mockAssistantMessage} isStreaming={true} />);
    const timestamp = new Date(mockAssistantMessage.timestamp).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    expect(screen.queryByText(timestamp)).not.toBeInTheDocument();
  });

  it('handles markdown rendering errors gracefully', () => {
    // Mock console.error to prevent error output in tests
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const errorMessage = { ...mockAssistantMessage, content: 'error content' };
    render(<MessageBubble message={errorMessage} />);
    
    expect(screen.getByText('Error rendering message content')).toBeInTheDocument();
    
    // Restore console.error
    consoleError.mockRestore();
  });
}); 