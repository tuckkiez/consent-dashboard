import sqlite3
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def init_db():
    """Initialize database"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create table if not exists (ไม่ drop table แล้ว)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS consent_data (
            date TEXT PRIMARY KEY,
            total_consents INTEGER,
            privacy_policy_consents INTEGER,
            marketing_consents INTEGER,
            marketing_consent_percentage REAL,
            f1_channel_consents INTEGER,
            kp_channel_consents INTEGER,
            gwl_channel_consents INTEGER,
            dropoff_count INTEGER,
            dropoff_percentage REAL,
            new_users INTEGER DEFAULT 0,
            created_at TEXT
        )
    ''')
    logger.info("Database initialized")
    
    conn.commit()
    conn.close()
    logger.info("Database initialized")

def save_consent_data(data, date):
    """Save consent data to database"""
    conn = None
    try:
        conn = sqlite3.connect('consent_data.db')
        cursor = conn.cursor()
        
        # เตรียมข้อมูลสำหรับบันทึก
        values = (
            date,
            int(data.get('total_consents', 0)),
            int(data.get('privacy_policy_consents', 0)),
            int(data.get('marketing_consents', 0)),
            float(data.get('marketing_consent_percentage', 0)),
            int(data.get('f1_channel_consents', 0)),
            int(data.get('kp_channel_consents', 0)),
            int(data.get('gwl_channel_consents', 0)),
            int(data.get('dropoff_count', 0)),
            float(data.get('dropoff_percentage', 0)),
            int(data.get('new_users', 0)),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )
        
        # บันทึกข้อมูล
        cursor.execute("""
            INSERT OR REPLACE INTO consent_data (
                date,
                total_consents,
                privacy_policy_consents,
                marketing_consents,
                marketing_consent_percentage,
                f1_channel_consents,
                kp_channel_consents,
                gwl_channel_consents,
                dropoff_count,
                dropoff_percentage,
                new_users,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, values)
        
        conn.commit()
        print(f"บันทึกข้อมูลสำหรับวันที่ {date} สำเร็จ")
    except Exception as e:
        print(f"Error saving consent data: {str(e)}")
        raise e
    finally:
        if conn:
            conn.close()

def get_consent_data(start_date: str, end_date: str = None):
    """Get consent data for a date range"""
    conn = sqlite3.connect('consent_data.db')
    c = conn.cursor()
    
    try:
        if end_date:
            c.execute('''
                SELECT 
                    date,
                    total_consents,
                    privacy_policy_consents,
                    marketing_consents,
                    marketing_consent_percentage,
                    f1_channel_consents,
                    kp_channel_consents,
                    gwl_channel_consents,
                    dropoff_count,
                    dropoff_percentage,
                    new_users,
                    created_at
                FROM consent_data 
                WHERE date BETWEEN ? AND ?
                ORDER BY date DESC
            ''', (start_date, end_date))
        else:
            c.execute('''
                SELECT 
                    date,
                    total_consents,
                    privacy_policy_consents,
                    marketing_consents,
                    marketing_consent_percentage,
                    f1_channel_consents,
                    kp_channel_consents,
                    gwl_channel_consents,
                    dropoff_count,
                    dropoff_percentage,
                    new_users,
                    created_at
                FROM consent_data 
                WHERE date = ?
                ORDER BY date DESC
            ''', (start_date,))
        
        rows = c.fetchall()
        columns = [
            'date',
            'total_consents',
            'privacy_policy_consents',
            'marketing_consents',
            'marketing_consent_percentage',
            'f1_channel_consents',
            'kp_channel_consents',
            'gwl_channel_consents',
            'dropoff_count',
            'dropoff_percentage',
            'new_users',
            'created_at'
        ]
        
        return [dict(zip(columns, row)) for row in rows]
        
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

def get_db_connection():
    return sqlite3.connect('consent_data.db')

def get_all_consent_data():
    """Get all consent data from database"""
    conn = None
    try:
        conn = sqlite3.connect('consent_data.db')
        cursor = conn.cursor()
        # ตรวจสอบว่าตารางมีอยู่จริง
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='consent_data'
        """)
        if not cursor.fetchone():
            return []
            
        cursor.execute("""
            SELECT 
                date,
                total_consents,
                privacy_policy_consents,
                marketing_consents,
                marketing_consent_percentage,
                f1_channel_consents,
                kp_channel_consents,
                gwl_channel_consents,
                dropoff_count,
                dropoff_percentage,
                new_users,
                created_at
            FROM consent_data
            ORDER BY date DESC
        """)
        data = cursor.fetchall()
        
        # แปลงข้อมูลเป็น list of dict
        result = []
        for row in data:
            result.append({
                'date': row[0],
                'total_consents': row[1],
                'privacy_policy_consents': row[2],
                'marketing_consents': row[3],
                'marketing_consent_percentage': float(row[4]) if row[4] else 0,
                'f1_channel_consents': row[5],
                'kp_channel_consents': row[6],
                'gwl_channel_consents': row[7],
                'dropoff_count': row[8],
                'dropoff_percentage': float(row[9]) if row[9] else 0,
                'new_users': row[10]
            })
        return result
    except Exception as e:
        print(f"Error in get_all_consent_data: {str(e)}")
        return []  # ถ้าเกิด error ให้ return list ว่าง
    finally:
        if conn:
            conn.close()

def add_sample_data():
    """Add sample data for testing"""
    conn = None
    try:
        conn = sqlite3.connect('consent_data.db')
        cursor = conn.cursor()
        
        # เพิ่มข้อมูลตัวอย่าง
        sample_data = [
            ('2025-03-25', 85, 85, 65, 76.47, 10, 5, 2, 5, 5.88, 10),
            ('2025-03-26', 90, 90, 70, 77.78, 12, 6, 3, 8, 8.89, 15),
            ('2025-03-27', 93, 93, 72, 77.42, 15, 7, 4, 10, 10.75, 20)
        ]
        
        cursor.executemany("""
            INSERT OR REPLACE INTO consent_data (
                date,
                total_consents,
                privacy_policy_consents,
                marketing_consents,
                marketing_consent_percentage,
                f1_channel_consents,
                kp_channel_consents,
                gwl_channel_consents,
                dropoff_count,
                dropoff_percentage,
                new_users
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_data)
        
        conn.commit()
        print("Sample data added successfully")
    except Exception as e:
        print(f"Error adding sample data: {str(e)}")
    finally:
        if conn:
            conn.close()
