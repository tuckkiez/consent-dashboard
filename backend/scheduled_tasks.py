import asyncio
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    scheduler = AsyncIOScheduler()
    # Run daily at 1 AM
    scheduler.add_job(fetch_daily_data, 'cron', hour=1)
    scheduler.start()
    logger.info("Scheduler started - Daily data fetch scheduled for 1 AM")
