// Global configuration for API base URL
//
// This script allows you to define a global API base URL for all fetch requests
// in your front‑end without modifying your existing JavaScript code. If
// `window.API_BASE` is set, any relative `fetch` calls starting with `/api` will
// automatically be prefixed with that base. If `window.API_BASE` is empty or
// undefined, the relative paths remain unchanged.
//
// Usage:
// 1. Upload this file to the root of your web hosting (e.g. via FTP).
// 2. In each HTML page that makes API requests (e.g. index.html, admin.html),
//    include this script before your other scripts:
//    <script src="/config.js"></script>
//    <script src="/script.js"></script>
//    ...
// 3. Set `window.API_BASE` in this file to the full URL of your backend. For
//    example:
//      window.API_BASE = "https://your-backend.onrender.com";
//    Do not include a trailing slash.
//
// Once configured, calls like `fetch('/api/products')` will
// automatically be converted to
// `fetch(window.API_BASE + '/api/products')`.

(function() {
  // Allow defining API_BASE on this file. If left undefined, API_BASE will
  // default to an empty string. You can edit this value when deploying
  // your front‑end to point at your Render backend, for example:
  //   window.API_BASE = "https://your-backend.onrender.com";
  window.API_BASE = window.API_BASE || '';

  // Preserve the original fetch implementation
  const originalFetch = window.fetch.bind(window);

  // Override the global fetch function
  window.fetch = function(input, init) {
    // Derive the URL from the input. The input can be either a string or a
    // Request object.
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input && typeof input.url === 'string') {
      url = input.url;
    }

    // If the URL starts with '/api', prefix it with API_BASE
    if (url.startsWith('/api')) {
      const prefixedUrl = (window.API_BASE || '') + url;
      if (typeof input === 'string') {
        input = prefixedUrl;
      } else {
        input = new Request(prefixedUrl, input);
      }
    }

    return originalFetch(input, init);
  };
})();