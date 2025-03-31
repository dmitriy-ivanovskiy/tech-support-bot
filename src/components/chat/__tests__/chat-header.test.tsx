import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatHeader from '../chat-header';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('ChatHeader', () => {
  it('renders title correctly', () => {
    render(<ChatHeader title="Test Chat" />);
    expect(screen.getByText('Test Chat')).toBeInTheDocument();
  });

  it('renders back button with correct link', () => {
    render(<ChatHeader title="Test Chat" />);
    const backButton = screen.getByRole('link', { name: /back/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute('href', '/');
  });

  it('renders back arrow icon', () => {
    render(<ChatHeader title="Test Chat" />);
    const backArrow = screen.getByRole('img', { hidden: true });
    expect(backArrow).toBeInTheDocument();
  });
}); 