import asyncio
import logging
import os
from datetime import datetime, timedelta
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ตั้งค่า timezone เป็นกรุงเทพฯ
tz = pytz.timezone('Asia/Bangkok')

async def fetch_daily_data():
    """Daily task to fetch user data from Auth0"""
    try:
        # Import here to avoid circular import
        from main import ensure_user_data_exists
        
        today = datetime.now().strftime('%Y-%m-%d')
        logger.info(f"Starting daily data fetch for {today}")
        await ensure_user_data_exists(today)
        logger.info("Daily data fetch completed successfully")
    except Exception as e:
        logger.error(f"Error in daily data fetch: {e}")

def start_scheduler():
    try:
        scheduler = AsyncIOScheduler(timezone=tz)
        # Run daily at 5 AM Bangkok time
        scheduler.add_job(
            fetch_daily_data,
            'cron',
            hour=5,
            minute=0,
            timezone=tz,
            misfire_grace_time=3600  # ให้รันช้าได้สูงสุด 1 ชม.
        )
        
        # เรียกใช้งานทันทีเมื่อเริ่มต้น (สำหรับการ debug)
        if os.getenv('ENV') == 'development':
            asyncio.create_task(fetch_daily_data())
            
        scheduler.start()
        logger.info(f"Scheduler started - Next run at: {scheduler.get_jobs()[0].next_run_time}")
        return scheduler
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        raise
