# Consent Dashboard

แอปพลิเคชันสำหรับติดตามและแสดงข้อมูลการให้ความยินยอม (consent) จากผู้ใช้งาน โดยดึงข้อมูลจาก OneTrust API และแสดงผลในรูปแบบตารางและกราฟ

## การติดตั้งและรัน

### วิธีรัน Local (แยก Frontend และ Backend)

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

#### Frontend
```bash
cd frontend
python -m http.server 3000
```

เข้าใช้งานที่ http://localhost:3000

#### Fetch all
```
cd scripts
node fetch_all.js
```

### วิธี Deploy

#### Frontend (GitHub Pages)
1. Push โค้ดขึ้น GitHub repository: https://github.com/tuckkiez/consent-dashboard.git
2. ตั้งค่า GitHub Pages ให้ deploy จาก branch main, folder /
3. Frontend URL: https://tuckkiez.github.io/consent-dashboard/

#### Backend (Render.com)
1. สร้าง Web Service ใหม่บน Render.com
2. เลือก GitHub repository และ branch main
3. Runtime: Docker
4. Backend URL: https://consent-dashboard.onrender.com

## เทคโนโลยีที่ใช้

### Frontend
- React
- Chart.js
- Axios
- Tailwind CSS

### Backend
- FastAPI
- SQLite
- Pandas
- APScheduler

## API Endpoints

- `/api/all-consent-data`: ดึงข้อมูล consent ทั้งหมดจากฐานข้อมูล
- `/api/consent-data/{date}`: ดึงข้อมูล consent ของวันที่ระบุ
- `/api/manual-fetch/{date}`: สั่งให้ backend ดึงข้อมูลจาก OneTrust API สำหรับวันที่ระบุ
- `/api/dashboard-summary`: ดึงข้อมูลสรุปสำหรับ dashboard
- `/api/daily-stats`: ดึงข้อมูลสถิติรายวันสำหรับกราฟ
