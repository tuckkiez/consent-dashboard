const axios = require('axios');

async function fetchAllDates() {
    // ตั้งค่า startDate เป็นวันที่ 18 มิ.ย. 2568 เวลา 00:00:00 ตามเวลาไทย
    // โดยใช้ Date.UTC เพื่อกำหนดเวลาเป็น 17:00 UTC ของวันที่ 17 มิ.ย. (ซึ่งเท่ากับ 00:00 วันที่ 18 มิ.ย. ตามเวลาไทย)
    const startDate = new Date(Date.UTC(2025, 5, 17, 17, 0, 0));
    console.log('startDate (UTC):', startDate.toISOString(), 'Local:', startDate.toString());
    
    // หาวันเมื่อวาน (วันที่ 21 มิ.ย. 2568) โดยตั้ง timezone เป็นไทย (UTC+7)
    const now = new Date();
    const thaiDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    
    // ตั้งเวลาเป็น 00:00:00 ของเมื่อวาน
    const yesterday = new Date(thaiDate);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // แสดงช่วงวันที่ที่กำลังจะดึงข้อมูล (แปลงเป็นรูปแบบ YYYY-MM-DD ตาม timezone ไทย)
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(yesterday);
    console.log(`ดึงข้อมูลตั้งแต่: ${startDateStr} ถึง: ${endDateStr}`);
    
    let currentDate = new Date(startDate);

    while (currentDate <= yesterday) { // ใช้ <= เพื่อรวมถึงวันสุดท้าย (เมื่อวาน)
        const dateStr = formatDate(currentDate);
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
