const axios = require('axios');

// กำหนด URL ของ API
const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8001';

// ฟังก์ชันสำหรับสร้าง URL แบบเต็ม
const getApiUrl = (path) => {
  return `${API_BASE_URL}${path}`;
};

async function refetchDate(dateStr) {
    console.log(`Refetching data for ${dateStr}...`);
    
    try {
        // ลบข้อมูลเก่าก่อน
        await axios.delete(getApiUrl(`/api/consent-data/${dateStr}`));
        console.log(`✓ Deleted old data for ${dateStr}`);
        
        // รอสักครู่ให้ backend จัดการการลบข้อมูล
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // ดึงข้อมูลใหม่
        await axios.get(getApiUrl(`/api/consent-data/${dateStr}`));
        console.log(`✓ Fetched new data for ${dateStr}`);
        
        return true;
    } catch (error) {
        console.error(`✗ Error refetching ${dateStr}:`, error.message);
        return false;
    }
}

async function fetchAllDates() {
    // ตั้ง timezone เป็นไทย (UTC+7)
    const now = new Date();
    const thaiDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    
    // ตั้งเวลาเป็น 00:00:00 ของเมื่อวาน
    const yesterday = new Date(thaiDate);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // ฟังก์ชันสำหรับแปลงวันที่เป็นรูปแบบ YYYY-MM-DD
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const dateStr = formatDate(yesterday);
    console.log(`กำลังดึงข้อมูลสำหรับวันที่: ${dateStr} (ตามเวลาไทย)`);
    
    // เรียกใช้ refetchDate เพื่อลบและดึงข้อมูลใหม่
    const success = await refetchDate(dateStr);
    
    if (success) {
        console.log(`✓ ดึงข้อมูลสำหรับวันที่ ${dateStr} สำเร็จ`);
        return true;
    } else {
        console.error(`✗ ไม่สามารถดึงข้อมูลสำหรับวันที่ ${dateStr} ได้`);
        return false;
    }
}

// ตัวอย่างการใช้งาน refetchDate
// refetchDate('2025-06-19').then(success => {
//     if (success) {
//         console.log('Refetch completed successfully!');
//     } else {
//         console.log('Refetch failed.');
//     }
// });

// ตรวจสอบว่าถูกเรียกโดยตรงหรือไม่
if (require.main === module) {
    fetchAllDates().catch(error => {
        console.error('Error in fetchAllDates:', error);
        process.exit(1);
    });
}

// Export ฟังก์ชันเพื่อให้ไฟล์อื่นสามารถเรียกใช้ได้
module.exports = {
    fetchAllDates,
    refetchDate
};
