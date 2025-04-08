import os
import json
import pandas as pd
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
import time
import gzip
import shutil
import asyncio
from dotenv import load_dotenv
from scheduled_tasks import start_scheduler
import logging
from database import get_consent_data, save_consent_data, init_db, get_all_consent_data, add_sample_data
import database
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
ONETRUST_API_TOKEN = os.getenv("ONETRUST_API_TOKEN")
AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID")
AUTH0_CLIENT_SECRET = os.getenv("AUTH0_CLIENT_SECRET")
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
COLLECTION_POINT_GUID = "2b0e809d-9d2c-4ebd-ab48-1519d7bcf5cc"
BASE_URL = "https://app-apac.onetrust.com/api/consentmanager/v1"

class ConsentStats(BaseModel):
    total_consents: int
    privacy_policy_consents: int
    marketing_consents: int
    f1_channel_consents: int
    kp_channel_consents: int
    gwl_channel_consents: int
    dropoff_count: int
    dropoff_percentage: float
    marketing_consent_percentage: float
    new_users: int
    date: str

async def get_auth0_token():
    """Get Auth0 access token"""
    auth0_domain = os.getenv("AUTH0_DOMAIN")
    auth0_client_id = os.getenv("AUTH0_CLIENT_ID")
    auth0_client_secret = os.getenv("AUTH0_CLIENT_SECRET")
    auth0_audience = os.getenv("AUTH0_AUDIENCE")

    if not all([auth0_domain, auth0_client_id, auth0_client_secret, auth0_audience]):
        raise ValueError("Missing Auth0 credentials")

    url = f"https://{auth0_domain}/oauth/token"
    payload = {
        "grant_type": "client_credentials",
        "client_id": auth0_client_id,
        "client_secret": auth0_client_secret,
        "audience": auth0_audience
    }
    headers = {"content-type": "application/x-www-form-urlencoded"}

    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=payload, headers=headers)
        print(f"Debug - Auth0 token response: {response.status_code}")
        print(f"Debug - Auth0 token response body: {response.text}")
        response.raise_for_status()
        return response.json()["access_token"]

async def create_export_job(token: str):
    """Create a new export job."""
    url = f"https://{AUTH0_DOMAIN}/api/v2/jobs/users-exports"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {
        "format": "csv",
        "limit": 999999,
        "fields": [
            {"name": "user_id"},
            {"name": "user_metadata.f1_profile_id", "export_as": "f1_profile_id"},
            {"name": "user_metadata.kp_profile_id", "export_as": "kp_profile_id"},
            {"name": "user_metadata.gwl_profile_id", "export_as": "gwl_profile_id"}
        ]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        print(f"Debug - Create job response: {response.status_code}")
        print(f"Debug - Create job response body: {response.text}")
        if response.status_code not in [200, 201]:
            response.raise_for_status()
        return response.json()["id"]

async def get_job_status(job_id: str, token: str):
    """Get the status of an export job."""
    url = f"https://{AUTH0_DOMAIN}/api/v2/jobs/{job_id}"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        print(f"Debug - Job status response: {response.status_code}")
        print(f"Debug - Job status response body: {response.text}")
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to get job status")
        return response.json()

async def download_csv(url: str, date: str):
    """Download and save the CSV file."""
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(data_dir, exist_ok=True)
    
    filename = os.path.join(data_dir, f"users_{date}.csv")
    temp_gz = filename + ".gz"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        print(f"Debug - Download CSV response: {response.status_code}")
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to download CSV")
        
        # Save gzipped file
        with open(temp_gz, "wb") as f:
            f.write(response.content)
        
        # Extract gzipped file
        with gzip.open(temp_gz, "rb") as gz:
            with open(filename, "wb") as f:
                shutil.copyfileobj(gz, f)
        
        # Remove gzipped file
        os.remove(temp_gz)
        return filename

def load_user_data(date: str):
    """Load user data from CSV file for the specified date."""
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    filename = os.path.join(data_dir, f"users_{date}.csv")
    print(f"Debug - Loading user data from: {filename}")
    
    if not os.path.exists(filename):
        print(f"Debug - User data file not found: {filename}")
        return None
    
    try:
        df = pd.read_csv(filename)
        print(f"Debug - Successfully loaded user data with shape: {df.shape}")
        print(f"Debug - Columns: {df.columns.tolist()}")
        print(f"Debug - First few rows:\n{df.head()}")
        return df
    except Exception as e:
        print(f"Debug - Error loading user data: {str(e)}")
        raise

async def ensure_user_data_exists(date: str):
    """Ensure user data exists for the specified date."""
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(data_dir, exist_ok=True)
    
    filename = os.path.join(data_dir, f"users_{date}.csv")
    print(f"Debug - CSV file path: {filename}")
    
    if not os.path.exists(filename):
        print(f"Debug - CSV file not found: {filename}")
        try:
            # Get Auth0 token
            token = await get_auth0_token()
            print("Debug - Got Auth0 token")
            
            # Create export job
            job_id = await create_export_job(token)
            print(f"Debug - Created export job: {job_id}")
            
            # Wait for job completion
            max_retries = 10
            retry_delay = 2  # seconds
            
            for i in range(max_retries):
                print(f"Debug - Checking job status (attempt {i+1}/{max_retries})")
                status = await get_job_status(job_id, token)
                print(f"Debug - Job status: {status}")
                
                if status["status"] == "completed":
                    if "location" in status:
                        print(f"Debug - Job completed, downloading from: {status['location']}")
                        await download_csv(status["location"], date)
                        print(f"Debug - CSV downloaded to: {filename}")
                        return
                    else:
                        raise ValueError("Job completed but no download URL provided")
                
                if status["status"] == "failed":
                    raise ValueError(f"Export job failed: {status.get('error', 'Unknown error')}")
                
                if i < max_retries - 1:
                    print(f"Debug - Job not ready, waiting {retry_delay} seconds...")
                    await asyncio.sleep(retry_delay)
            
            raise ValueError(f"Job did not complete after {max_retries} attempts")
            
        except Exception as e:
            print(f"Debug - Error in ensure_user_data_exists: {str(e)}")
            raise

def count_channel_consents(identifiers, df):
    """นับจำนวน user ที่มี profile แต่ละช่องทาง"""
    if df is None:
        print("Debug - DataFrame is None!")
        return 0, 0, 0, None
    
    print(f"Debug - DataFrame head:\n{df.head()}")
    print(f"Debug - DataFrame columns: {df.columns.tolist()}")
    print(f"Debug - จำนวน identifiers ที่ต้องหา: {len(identifiers)}")
    
    # Clean user_id column by removing quotes
    df['user_id'] = df['user_id'].str.strip("'")
    
    # Find matching users in user_id column
    matched_users = df[df['user_id'].isin(identifiers)]
    print(f"Debug - จำนวน user ที่เจอใน CSV: {len(matched_users)}")
    
    # Count users with each profile type
    f1_count = matched_users['f1_profile_id'].notna().sum()
    kp_count = matched_users['kp_profile_id'].notna().sum()
    gwl_count = matched_users['gwl_profile_id'].notna().sum()
    
    print(f"Debug - สรุปจำนวน profile:")
    print(f"Debug - F1: {f1_count}")
    print(f"Debug - KP: {kp_count}")
    print(f"Debug - GWL: {gwl_count}")
    
    return f1_count, kp_count, gwl_count, matched_users

async def get_onetrust_token():
    """Get access token from OneTrust"""
    try:
        url = "https://app-apac.onetrust.com/api/access/v1/oauth/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": "93b83b2845774fa2a02e5eb1ee6925e3",
            "client_secret": "a8jcHqPNGdKS44IBGr9xx2BwXTAX2EkP"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            return token_data.get("access_token")
            
    except Exception as e:
        logger.error(f"Error getting OneTrust token: {str(e)}")
        raise

async def fetch_onetrust_data(date: str):
    """ดึงข้อมูล consent จาก OneTrust API"""
    # ขอ token ก่อน
    token = await get_onetrust_token()
    
    if not token:
        raise HTTPException(status_code=500, detail="ไม่สามารถขอ token ได้")

    timeout = httpx.Timeout(30.0)
    limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
    
    async with httpx.AsyncClient(timeout=timeout, limits=limits) as client:
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }
        url = "https://app-apac.onetrust.com/api/consentmanager/v1/datasubjects/profiles"
        params = {
            "updatedSince": f"{date}T00:00:00",
            "toDate": f"{date}T23:59:59",
            "size": 50,
            "collectionPointGuid": COLLECTION_POINT_GUID,
            "includeConsentData": "true",
            "includePurposes": "true"
        }
        
        print(f"Debug - เรียก OneTrust API ด้วย params: {params}")
        all_profiles = []
        identifiers = set()
        privacy_policy_count = 0
        marketing_count = 0
        page = 0
        
        while True:
            params["page"] = page
            print(f"Debug - ดึงข้อมูลหน้า {page}")
            
            try:
                response = await client.get(url, headers=headers, params=params)
                print(f"Debug - OneTrust response status: {response.status_code}")
                
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail=f"OneTrust API error: {response.text}")
                
                data = response.json()
                profiles = data.get("content", [])
                if not profiles:
                    break
                
                print(f"Debug - พบข้อมูล {len(profiles)} รายการในหน้า {page}")
                if page == 0:  # แสดงตัวอย่างข้อมูลเฉพาะหน้าแรก
                    print(f"Debug - ตัวอย่างข้อมูล profile แรก:")
                    print(json.dumps(profiles[0], indent=2))
                
                # เก็บข้อมูลทั้งหมด
                all_profiles.extend(profiles)
                for profile in profiles:
                    identifier = profile.get("Identifier")  
                    if identifier:
                        identifiers.add(identifier)
                    
                    # เช็คสถานะของ consent ใน Purposes array
                    purposes = profile.get("Purposes", [])
                    if page == 0 and profile == profiles[0]:  # แสดงตัวอย่างข้อมูลเฉพาะ profile แรก
                        print(f"Debug - ตัวอย่าง purposes:")
                        print(json.dumps(purposes, indent=2))
                    
                    # นับจำนวน consent ที่ active
                    for purpose in purposes:
                        if purpose.get("Status") == "ACTIVE":
                            name = purpose.get("Name")
                            if name == "King Power Online - Privacy Policy":
                                privacy_policy_count += 1
                            elif name == "King Power Online - Marketing":
                                marketing_count += 1
                
                page += 1
                
            except Exception as e:
                print(f"Debug - เกิดข้อผิดพลาด: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
    
    total_count = len(all_profiles)
    print(f"Debug - สรุปข้อมูลจาก OneTrust:")
    print(f"Debug - จำนวน consent ทั้งหมด: {total_count}")
    print(f"Debug - Privacy Policy: {privacy_policy_count}")
    print(f"Debug - Marketing: {marketing_count}")
    print(f"Debug - ตัวอย่าง identifiers: {list(identifiers)[:5]}")
    
    return {
        "total_count": total_count,
        "privacy_policy_count": privacy_policy_count,
        "marketing_count": marketing_count,
        "identifiers": identifiers
    }

async def fetch_consent_data(date: str):
    """ดึงข้อมูล consent จาก OneTrust API และบันทึกข้อมูล"""
    print(f"\nDebug - เริ่มดึงข้อมูลวันที่ {date}")
    
    # ดึงข้อมูลจาก OneTrust
    consent_data = await fetch_onetrust_data(date)
    print(f"Debug - ได้ข้อมูลจาก OneTrust API:")
    print(f"Debug - total_count: {consent_data['total_count']}")
    print(f"Debug - privacy_policy_count: {consent_data['privacy_policy_count']}")
    print(f"Debug - marketing_count: {consent_data['marketing_count']}")
    print(f"Debug - จำนวน identifiers: {len(consent_data['identifiers'])}")
    
    # นับจำนวน new users (ที่ไม่มี prefix auth0|f1 หรือ auth0|kp)
    new_users = 0
    for identifier in consent_data['identifiers']:
        if not (identifier.startswith('auth0|f1') or identifier.startswith('auth0|kp')):
            new_users += 1
            print(f"Debug - Found new user: {identifier}")
    
    print(f"Debug - Total new users: {new_users}")
    
    # เตรียมค่าเริ่มต้นสำหรับ response
    response_data = {
        "total_consents": consent_data["total_count"],
        "privacy_policy_consents": consent_data["privacy_policy_count"],
        "marketing_consents": consent_data["marketing_count"],
        "marketing_consent_percentage": (consent_data["marketing_count"] / consent_data["total_count"] * 100) if consent_data["total_count"] > 0 else 0,
        "f1_channel_consents": 0,
        "kp_channel_consents": 0,
        "gwl_channel_consents": 0,
        "dropoff_count": consent_data["total_count"],  # ค่าเริ่มต้น = จำนวน consent ทั้งหมด
        "dropoff_percentage": 100.0,  # ค่าเริ่มต้น = 100%
        "new_users": new_users,  # เพิ่ม new_users
        "date": date
    }
    
    # ลองโหลดข้อมูล CSV
    try:
        df = load_user_data(datetime.now().strftime("%Y-%m-%d"))
        if df is None:
            print("Debug - ไม่พบไฟล์ CSV จะลองดาวน์โหลดใหม่")
            await ensure_user_data_exists(datetime.now().strftime("%Y-%m-%d"))
            df = load_user_data(datetime.now().strftime("%Y-%m-%d"))
        
        if df is not None:
            print(f"Debug - พบข้อมูล CSV columns: {df.columns.tolist()}")
            
            # นับจำนวน profile ของ user ที่ให้ consent
            f1_count, kp_count, gwl_count, matched_users = count_channel_consents(consent_data["identifiers"], df)
            
            # อัพเดต response data
            users_with_profile = f1_count + kp_count  # เปลี่ยนวิธีคำนวณ dropoff ให้ใช้แค่ F1 + KP
            
            response_data.update({
                "f1_channel_consents": f1_count,
                "kp_channel_consents": kp_count,
                "gwl_channel_consents": gwl_count,
                "dropoff_count": consent_data["total_count"] - users_with_profile,
                "dropoff_percentage": ((consent_data["total_count"] - users_with_profile) / consent_data["total_count"] * 100) if consent_data["total_count"] > 0 else 0
            })
            
    except Exception as e:
        print(f"Debug - เกิดข้อผิดพลาดในการโหลด CSV: {str(e)}")
        print("Debug - จะใช้ค่าเริ่มต้นแทน")
    
    return response_data

async def daily_data_fetch():
    """ทำงานทุกวันตอน 05:00 (ตี 5) เพื่อดึงข้อมูลของวันก่อนหน้า"""
    try:
        # 1. คำนวณวันที่
        today = datetime.now()
        yesterday = today - timedelta(days=1)
        yesterday_str = yesterday.strftime("%Y-%m-%d")
        today_str = today.strftime("%Y-%m-%d")

        print(f"Debug - เริ่มต้น daily data fetch สำหรับวันที่ {yesterday_str}")
        print(f"Debug - ใช้ CSV ของวันที่ {today_str}")

        # 1. โหลด CSV ของวันปัจจุบัน (เพราะมีข้อมูลล่าสุด)
        await ensure_user_data_exists(today_str)
        
        # 2. fetch ข้อมูล consent ของเมื่อวาน
        await fetch_consent_data(yesterday_str)
        
        print("Debug - daily data fetch สำเร็จ")
    except Exception as e:
        print(f"Error in daily data fetch: {str(e)}")

def start_scheduler():
    """เริ่มต้น scheduler สำหรับ daily data fetch"""
    scheduler = AsyncIOScheduler()
    
    # ตั้งให้ทำงานทุกวันเวลา 05:00 (ตี 5)
    scheduler.add_job(daily_data_fetch, 'cron', 
                     hour=5, 
                     minute=0,
                     id='daily_fetch')
    
    scheduler.start()
    print("Debug - Scheduler started - จะทำงานทุกวันเวลา 05:00 (ตี 5)")

@app.get("/api/consent-data/{date}")
async def get_consent_data(date: str):
    try:
        # ถ้าเป็นวันปัจจุบัน ให้ยิง API โดยตรง
        today = datetime.now().strftime("%Y-%m-%d")
        if date == today:
            consent_data = await fetch_consent_data(date)
            # บันทึกข้อมูลลง database
            database.save_consent_data(consent_data, date)
            return ConsentStats(**consent_data)
        
        # ถ้าไม่ใช่วันปัจจุบัน ให้เช็คใน database ก่อน
        stored_data = database.get_consent_data(date)
        if stored_data and len(stored_data) > 0:
            print(f"Found data in database for {date}")
            return ConsentStats(**stored_data[0])  # Return first row since we're querying for a specific date
            
        print(f"No data in database for {date}, fetching from API")
        # ถ้าไม่มีข้อมูลใน database ให้ดึงจาก API
        consent_data = await fetch_consent_data(date)
        database.save_consent_data(consent_data, date)
        return ConsentStats(**consent_data)
        
    except Exception as e:
        print(f"Debug - เกิดข้อผิดพลาด: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/all-consent-data")
async def get_all_consent_data():
    """Get all consent data from database"""
    try:
        print("Fetching all consent data...")
        # ดึงข้อมูลทั้งหมดจาก database
        data = database.get_all_consent_data()
        print("Data:", data)
        return data
    except Exception as e:
        print(f"Error fetching all consent data: {str(e)}")
        return []  # Return empty list instead of raising error

@app.get("/api/historical-data")
async def get_historical_data(start_date: str, end_date: str):
    try:
        # แปลงวันที่เป็น datetime
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        # สร้าง list เก็บข้อมูลแต่ละวัน
        results = []
        
        # วนลูปดึงข้อมูลทีละวัน
        current = start
        while current <= end:
            date_str = current.strftime("%Y-%m-%d")
            try:
                # ใช้ฟังก์ชัน get_consent_data เดิม
                data = await get_consent_data_by_date(date_str)
                results.append(data)
            except Exception as e:
                print(f"Error fetching data for {date_str}: {str(e)}")
            current += timedelta(days=1)
        
        return results
    except Exception as e:
        print(f"Error in historical data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/manual-fetch/{date}")
async def manual_fetch(date: str):
    """Manual fetch data for specific date"""
    logger = logging.getLogger(__name__)
    try:
        # ดึงข้อมูลจาก API โดยตรง ไม่เช็ค database
        consent_data = await fetch_consent_data(date)
        if consent_data:
            return {"status": "success", "message": f"Data fetched for {date}"}
        else:
            return {"status": "error", "message": "Failed to fetch data"}
    except Exception as e:
        logger.error(f"Error in manual fetch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard-summary")
async def get_dashboard_summary():
    """Get summary data for dashboard by summing all data in database"""
    try:
        # ดึงข้อมูลทั้งหมดจาก database
        all_data = await get_all_consent_data()
        
        # เตรียมตัวแปรสำหรับรวมค่า
        total_consents = 0
        privacy_policy_consents = 0
        marketing_consents = 0
        f1_channel_consents = 0
        kp_channel_consents = 0
        gwl_channel_consents = 0
        dropoff_count = 0
        new_users = 0
        
        # รวมค่าจากทุกวัน
        for data in all_data:
            total_consents += data.get('total_consents', 0) or 0
            privacy_policy_consents += data.get('privacy_policy_consents', 0) or 0
            marketing_consents += data.get('marketing_consents', 0) or 0
            f1_channel_consents += data.get('f1_channel_consents', 0) or 0
            kp_channel_consents += data.get('kp_channel_consents', 0) or 0
            gwl_channel_consents += data.get('gwl_channel_consents', 0) or 0
            dropoff_count += data.get('dropoff_count', 0) or 0
            new_users += data.get('new_users', 0) or 0
        
        # คำนวณ percentage
        marketing_consent_percentage = (marketing_consents / total_consents * 100) if total_consents > 0 else 0
        dropoff_percentage = (dropoff_count / total_consents * 100) if total_consents > 0 else 0
        
        return {
            "total_consents": total_consents,
            "privacy_policy_consents": privacy_policy_consents,
            "marketing_consents": marketing_consents,
            "marketing_consent_percentage": marketing_consent_percentage,
            "f1_channel_consents": f1_channel_consents,
            "kp_channel_consents": kp_channel_consents,
            "gwl_channel_consents": gwl_channel_consents,
            "dropoff_count": dropoff_count,
            "dropoff_percentage": dropoff_percentage,
            "new_users": new_users
        }
        
    except Exception as e:
        print(f"Error getting dashboard summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/daily-stats")
async def get_daily_stats():
    """Get daily statistics for charts"""
    try:
        # Get all data from database
        all_data = await get_all_consent_data()
        
        # Convert data types and format for charts
        formatted_data = []
        for data in all_data:
            formatted_data.append({
                "date": data["date"],
                "total_consents": int(data.get("total_consents", 0) or 0),
                "marketing_consent_percentage": float(data.get("marketing_consent_percentage", 0) or 0),
                "dropoff_percentage": float(data.get("dropoff_percentage", 0) or 0)
            })
            
        return formatted_data
            
    except Exception as e:
        print(f"Error getting daily stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/check-csv-files")
async def check_csv_files():
    """Check if CSV files exist in the data directory"""
    logger = logging.getLogger(__name__)
    try:
        # สร้างโฟลเดอร์ data ถ้ายังไม่มี
        data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        os.makedirs(data_dir, exist_ok=True)
        
        # ตรวจสอบว่ามีไฟล์ CSV อยู่หรือไม่
        csv_files = [f for f in os.listdir(data_dir) if f.endswith(".csv")]
        
        # จัดเตรียมข้อมูลที่จะส่งกลับ
        result = {
            "data_directory": data_dir,
            "exists": os.path.exists(data_dir),
            "csv_files": csv_files,
            "file_count": len(csv_files),
            "last_modified": None,
            "disk_info": {
                "total": None,
                "used": None,
                "free": None
            }
        }
        
        # ถ้ามีไฟล์ CSV อยู่ หาวันที่แก้ไขล่าสุด
        if csv_files:
            latest_file = max(
                [os.path.join(data_dir, f) for f in csv_files],
                key=os.path.getmtime
            )
            result["last_modified"] = datetime.fromtimestamp(
                os.path.getmtime(latest_file)
            ).isoformat()
        
        # ตรวจสอบพื้นที่ดิสก์
        try:
            import shutil
            total, used, free = shutil.disk_usage("/")
            result["disk_info"] = {
                "total": total,
                "used": used,
                "free": free
            }
        except Exception as e:
            logger.warning(f"Could not get disk usage: {str(e)}")
        
        logger.info(f"CSV files check result: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error checking CSV files: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    """Initialize database and start scheduler"""
    init_db()
    start_scheduler()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)


@app.get("/ping")
@app.head("/ping")
def ping():
    return JSONResponse(content={"status": "ok"})