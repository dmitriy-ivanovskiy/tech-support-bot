import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatWindow from '../chat-window';
import { ChatMessage } from '@/services/chat-service';

// Mock MessageBubble component
jest.mock('../message-bubble', () => {
  return function MockMessageBubble({ message, isStreaming }: { message: any; isStreaming?: boolean }) {
    return (
      <div data-testid="message-bubble" data-streaming={isStreaming}>
        {message.content}
      </div>
    );
  };
});

describe('ChatWindow', () => {
  const mockMessages: ChatMessage[] = [
    { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
    { id: '2', role: 'assistant', content: 'Hi there!', timestamp: Date.now() }
  ];

  // Create a mock ref with scrollIntoView function
  const mockScrollIntoView = jest.fn();
  const mockRef = {
    current: document.createElement('div')
  } as React.RefObject<HTMLDivElement>;

  // Add scrollIntoView to the mock div
  if (mockRef.current) {
    mockRef.current.scrollIntoView = mockScrollIntoView;
  }

  beforeEach(() => {
    // Clear mock function calls before each test
    mockScrollIntoView.mockClear();
  });

  it('renders messages correctly', () => {
    render(
      <ChatWindow
        messages={mockMessages}
        isLoading={false}
        streamingMessageId={null}
      />
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(
      <ChatWindow
        messages={mockMessages}
        isLoading={true}
        streamingMessageId={null}
      />
    );

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('handles streaming messages correctly', () => {
    render(
      <ChatWindow
        messages={mockMessages}
        isLoading={false}
        streamingMessageId="2"
      />
    );

    const messages = screen.getAllByTestId('message-bubble');
    const streamingMessage = messages.find(msg => msg.textContent === 'Hi there!');
    expect(streamingMessage).toHaveAttribute('data-streaming', 'true');
  });

  it('scrolls to bottom when messages change', () => {
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    
    render(
      <ChatWindow
        messages={mockMessages}
        isLoading={false}
        streamingMessageId={null}
        messagesEndRef={mockRef}
      />
    );

    // Verify scrollIntoView was called
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('does not scroll while loading', () => {
    render(
      <ChatWindow
        messages={mockMessages}
        isLoading={true}
        streamingMessageId={null}
        messagesEndRef={mockRef}
      />
    );

    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it('handles empty messages array', () => {
    render(
      <ChatWindow
        messages={[]}
        isLoading={false}
        streamingMessageId={null}
      />
    );

    expect(screen.queryByTestId('message-bubble')).not.toBeInTheDocument();
  });
}); 