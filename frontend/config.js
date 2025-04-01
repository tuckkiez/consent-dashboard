// config.js
window.API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8001' // Local development
    : 'https://consent-dashboard.onrender.com'; // Production URL
