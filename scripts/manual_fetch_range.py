import requests
from datetime import datetime, timedelta
import time

API_URL = 'http://localhost:8001/api/manual-fetch/'

# กำหนดช่วงวันที่
START_DATE = '2025-02-27'
END_DATE = '2025-07-22'


def daterange(start_date, end_date):
    start = datetime.strptime(start_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d')
    for n in range((end - start).days + 1):
        yield (start + timedelta(n)).strftime('%Y-%m-%d')


def manual_fetch(date):
    url = API_URL + date
    try:
        r = requests.post(url, timeout=60)
        r.raise_for_status()
        print(f"[{date}] Success: {r.json().get('message', r.text)}")
    except Exception as e:
        print(f"[{date}] Error: {e}")


def main():
    for d in daterange(START_DATE, END_DATE):
        manual_fetch(d)
        time.sleep(1)  # พัก 1 วินาทีต่อวัน เพื่อไม่ให้ backend หน่วงเกินไป

if __name__ == '__main__':
    main()
