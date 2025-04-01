const axios = require('axios');

async function fetchAllDates() {
    const startDate = new Date('2025-02-27');
    const today = new Date();
    let currentDate = startDate;

    while (currentDate < today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        console.log(`Fetching ${dateStr}...`);
        
        try {
            await axios.get(`http://localhost:8001/api/consent-data/${dateStr}`);
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
