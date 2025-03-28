window.API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8001'
    : 'https://your-backend-url.onrender.com'; // จะได้ URL นี้หลังจาก deploy บน render.com
