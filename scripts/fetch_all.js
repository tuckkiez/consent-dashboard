const axios = require('axios');

// กำหนด URL ของ API จาก environment variable (สำหรับ workflow/production)
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

// ฟังก์ชันสำหรับแปลงวันที่เป็นรูปแบบ YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ฟังก์ชันแปลงวันที่จาก DD/MM/YYYY เป็น Date object
function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
}

async function fetchAllDates() {
    // วันที่เริ่มต้น (27/02/2025)
    const startDate = parseDate('29/07/2025');
    
    // วันที่สิ้นสุด (เมื่อวานของวันนี้)
    const now = new Date();
    const thaiDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    const endDate = new Date(thaiDate);
    endDate.setDate(endDate.getDate() - 1); // เมื่อวาน
    endDate.setHours(0, 0, 0, 0);
    
    console.log(`กำลังดึงข้อมูลตั้งแต่วันที่ ${formatDate(startDate)} ถึง ${formatDate(endDate)}`);
    
    // วนลูปดึงข้อมูลแต่ละวัน
    let currentDate = new Date(startDate);
    let successCount = 0;
    let failCount = 0;
    
    while (currentDate <= endDate) {
        const dateStr = formatDate(currentDate);
        console.log(`\n--- กำลังประมวลผลวันที่: ${dateStr} ---`);
        
        try {
            const success = await refetchDate(dateStr);
            if (success) {
                console.log(`✓ ดึงข้อมูลวันที่ ${dateStr} สำเร็จ`);
                successCount++;
            } else {
                console.log(`✗ ไม่สามารถดึงข้อมูลวันที่ ${dateStr} ได้`);
                failCount++;
            }
            
            // รอ 1 วินาทีก่อนที่จะดึงข้อมูลวันถัดไป เพื่อป้องกันการ rate limit
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`✗ เกิดข้อผิดพลาดในการดึงข้อมูลวันที่ ${dateStr}:`, error.message);
            failCount++;
        }
        
        // เพิ่มวันถัดไป
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('\n=== สรุปผลการดึงข้อมูล ===');
    console.log(`- จำนวนวันที่ดึงข้อมูลสำเร็จ: ${successCount} วัน`);
    console.log(`- จำนวนวันที่ดึงข้อมูลไม่สำเร็จ: ${failCount} วัน`);
    console.log('=========================');
}

// ===== เพิ่มส่วนรับ argument จาก command line =====
const args = process.argv.slice(2);
let startDateArg = null;
let endDateArg = null;

args.forEach((arg) => {
    if (arg.startsWith('--start-date=')) {
        startDateArg = arg.replace('--start-date=', '');
    }
    if (arg.startsWith('--end-date=')) {
        endDateArg = arg.replace('--end-date=', '');
    }
});

function getYesterdayStr() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().slice(0, 10);
}

// Only run fetchAllDates if this script is executed directly, not when required
if (require.main === module) {
    const startDate = startDateArg || getYesterdayStr();
    const endDate = endDateArg || getYesterdayStr();
    fetchAllDates(startDate, endDate).catch(console.error);
}

// Export ฟังก์ชันเพื่อให้ไฟล์อื่นสามารถเรียกใช้ได้
async function refetchSingleDate(dateStr) {
    console.log(`Refetching ONLY data for ${dateStr}...`);
    try {
        await axios.delete(getApiUrl(`/api/consent-data/${dateStr}`));
        console.log(`✓ Deleted old data for ${dateStr}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await axios.get(getApiUrl(`/api/consent-data/${dateStr}`));
        console.log(`✓ Fetched new data for ${dateStr}`);
        return true;
    } catch (error) {
        console.error(`✗ Error refetching ${dateStr}:`, error.message);
        return false;
    }
}

module.exports = {
    fetchAllDates,
    refetchSingleDate,
    refetchSingleDate
};
