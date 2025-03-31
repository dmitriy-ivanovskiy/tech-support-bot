/**
 * This file contains polyfills for browser compatibility
 * It also helps with preventing certain Node.js modules from causing issues in the browser
 */

// Handle missing global.process in the browser
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {},
    version: '',
    cwd: () => '/',
    browser: true
  };
}

// Prevent punycode deprecation warnings
if (typeof window !== 'undefined') {
  try {
    // This is to prevent warnings about punycode in the browser
    window.punycode = {
      decode: (str) => str,
      encode: (str) => str
    };
  } catch (e) {
    console.debug('Polyfill setup error:', e);
  }
}

export {}; 