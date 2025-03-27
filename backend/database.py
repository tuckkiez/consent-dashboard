import sqlite3
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def init_db():
    """Initialize the database"""
    conn = sqlite3.connect('consent_data.db')
    c = conn.cursor()
    
    # Create table for daily consent data
    c.execute('''
        CREATE TABLE IF NOT EXISTS consent_data (
            date TEXT PRIMARY KEY,
            total_count INTEGER,
            privacy_policy_count INTEGER,
            marketing_count INTEGER,
            marketing_consent_percentage REAL,
            f1_channel_count INTEGER,
            kp_channel_count INTEGER,
            gwl_channel_count INTEGER,
            dropoff_count INTEGER,
            dropoff_percentage REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized")

def save_consent_data(date: str, data: dict):
    """Save consent data for a specific date"""
    conn = sqlite3.connect('consent_data.db')
    c = conn.cursor()
    
    try:
        c.execute('''
            INSERT OR REPLACE INTO consent_data (
                date,
                total_count,
                privacy_policy_count,
                marketing_count,
                marketing_consent_percentage,
                f1_channel_count,
                kp_channel_count,
                gwl_channel_count,
                dropoff_count,
                dropoff_percentage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            date,
            data.get('total_count', 0),
            data.get('privacy_policy_count', 0),
            data.get('marketing_count', 0),
            data.get('marketing_consent_percentage', 0),
            data.get('f1_channel_count', 0),
            data.get('kp_channel_count', 0),
            data.get('gwl_channel_count', 0),
            data.get('dropoff_count', 0),
            data.get('dropoff_percentage', 0)
        ))
        
        conn.commit()
        logger.info(f"Saved consent data for {date}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving consent data for {date}: {str(e)}")
        return False
        
    finally:
        conn.close()

def get_consent_data(start_date: str, end_date: str = None):
    """Get consent data for a date range"""
    conn = sqlite3.connect('consent_data.db')
    c = conn.cursor()
    
    try:
        if end_date:
            c.execute('''
                SELECT * FROM consent_data 
                WHERE date BETWEEN ? AND ?
                ORDER BY date DESC
            ''', (start_date, end_date))
        else:
            c.execute('''
                SELECT * FROM consent_data 
                WHERE date = ?
            ''', (start_date,))
            
        columns = [description[0] for description in c.description]
        rows = c.fetchall()
        
        result = []
        for row in rows:
            # แปลงค่าให้เป็น type ที่ถูกต้อง
            row_dict = {}
            for i, value in enumerate(row):
                if columns[i] in ['total_count', 'privacy_policy_count', 'marketing_count', 
                                'f1_channel_count', 'kp_channel_count', 'gwl_channel_count',
                                'dropoff_count']:
                    if isinstance(value, bytes):
                        # แปลง bytes เป็น int (little-endian)
                        value = int.from_bytes(value, byteorder='little')
                    row_dict[columns[i]] = value if value is not None else 0
                elif columns[i] in ['marketing_consent_percentage', 'dropoff_percentage']:
                    row_dict[columns[i]] = float(value) if value is not None else 0.0
                else:
                    row_dict[columns[i]] = value
            result.append(row_dict)
            
        logger.info(f"ดึงข้อมูลจาก database สำหรับวันที่ {start_date}: {len(result)} รายการ")
        return result
        
    except Exception as e:
        logger.error(f"Error getting consent data: {str(e)}")
        return []
        
    finally:
        conn.close()

def get_missing_dates(start_date: str, end_date: str):
    """Get dates that don't have data in the database"""
    conn = sqlite3.connect('consent_data.db')
    c = conn.cursor()
    
    try:
        c.execute('''
            WITH RECURSIVE dates(date) AS (
                SELECT ?
                UNION ALL
                SELECT date(date, '+1 day')
                FROM dates
                WHERE date < ?
            )
            SELECT dates.date
            FROM dates
            LEFT JOIN consent_data ON dates.date = consent_data.date
            WHERE consent_data.date IS NULL
            ORDER BY dates.date
        ''', (start_date, end_date))
        
        result = []
        for row in c.fetchall():
            row_dict = dict(row)
            result.append(row_dict['date'])
            
        return result
        
    except Exception as e:
        logger.error(f"Error getting missing dates: {str(e)}")
        return []
        
    finally:
        conn.close()
