// Add any necessary polyfills here
if (typeof window !== 'undefined') {
  // Add any browser-specific polyfills here
  if (!window.matchMedia) {
    window.matchMedia = function(query) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: function() {},
        removeListener: function() {},
        addEventListener: function() {},
        removeEventListener: function() {},
        dispatchEvent: function() { return false; }
      };
    };
  }
} 