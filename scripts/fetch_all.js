const axios = require('axios');

async function fetchAllDates() {
    const startDate = new Date('2025-04-22');
    const today = new Date();
    let currentDate = startDate;

    while (currentDate < today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        console.log(`Fetching ${dateStr}...`);
        
        try {
            await axios.get(`http://127.0.0.1:8001/api/consent-data/${dateStr}`);
            console.log(`✓ Fetched ${dateStr}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`✗ Error fetching ${dateStr}:`, error.message);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('Done fetching all dates!');
}

fetchAllDates();
