/**
 * Utility to completely reset the application state
 * This helps fix issues with theme and chat state
 */

export function resetAppState() {
  if (typeof window === 'undefined') {
    return;
  }
  
  console.log('Resetting application state...');
  
  // Clear chat conversations
  localStorage.removeItem('chatConversations');
  
  // Reset theme
  localStorage.removeItem('theme');
  
  // Apply dark theme properly
  const root = window.document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Remove existing theme classes
  root.classList.remove('light', 'dark');
  
  // Set theme based on system preference
  if (prefersDark) {
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    root.classList.add('light');
    localStorage.setItem('theme', 'light');
  }
  
  // Set data-theme attribute
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  
  console.log('Application state reset complete');
  
  // Reload the page to apply all changes
  window.location.reload();
} 