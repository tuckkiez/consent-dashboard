const axios = require('axios');

const API_URL = 'https://consent-dashboard.onrender.com';

async function fetchAllDates() {
    const startDate = new Date('2025-04-22');
    const today = new Date();
    let currentDate = startDate;

    while (currentDate < today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        console.log(`Fetching ${dateStr}...`);
        
        try {
            await axios.get(`${API_URL}/api/consent-data/${dateStr}`);
            console.log(`✓ Fetched ${dateStr}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`✗ Error fetching ${dateStr}:`, error.message);
            // แสดงข้อมูล error เพิ่มเติมเพื่อ debug
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Status code:', error.response.status);
            }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('Done fetching all dates!');
}

fetchAllDates();
