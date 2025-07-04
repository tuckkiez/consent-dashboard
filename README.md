# Consent Dashboard

แอปพลิเคชันสำหรับติดตามและแสดงข้อมูลการให้ความยินยอม (consent) จากผู้ใช้งาน โดยดึงข้อมูลจาก OneTrust API และแสดงผลในรูปแบบตารางและกราฟ

## การติดตั้งและรัน

### Refetch ข้อมูลวันเดียว (เฉพาะวันที่ที่ต้องการ)

ใช้สคริปต์นี้เพื่อ refetch ข้อมูล consent เฉพาะวันเดียวที่ระบุ

```bash
node refetch_one.js YYYY-MM-DD
```
ตัวอย่างเช่น
```bash
node refetch_one.js 2025-07-02
```
- ระบบจะลบและดึงข้อมูลใหม่เฉพาะวันที่ที่ระบุเท่านั้น
- เหมาะสำหรับกรณีต้องการแก้ไข/รีเฟรชข้อมูลเฉพาะวัน


### วิธีรัน Local (แยก Frontend และ Backend)

#### Backend
```bash
python3.10 -m venv venv
source venv/bin/activate 
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

---

## วิธีใช้งานสคริปต์ดึงข้อมูล (fetch_all.js)

### ดึงข้อมูลของ "เมื่อวาน" (ค่า default)
```bash
node scripts/fetch_all.js
```

### ดึงข้อมูลช่วงวันที่ที่ต้องการ
```bash
node scripts/fetch_all.js --start-date=YYYY-MM-DD --end-date=YYYY-MM-DD
```
ตัวอย่าง:
```bash
node scripts/fetch_all.js --start-date=2025-07-01 --end-date=2025-07-03
```

- ถ้าไม่ระบุ argument ใดๆ จะดึงข้อมูลของเมื่อวานโดยอัตโนมัติ (เหมาะกับใช้งานใน workflow หรือ cron job)
- สามารถใช้ร่วมกับ GitHub Actions เพื่อดึงข้อมูลอัตโนมัติทุกวัน
