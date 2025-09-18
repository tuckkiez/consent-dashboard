import requests
import csv
from datetime import datetime

# URL ของ backend API (ปรับตามที่ใช้งานจริง)
API_URL = 'http://localhost:8001/api/historical-data'

# กำหนดช่วงวันที่ที่ต้องการ export
EXPORT_SINGLE = {
    'name': 'all_20250227_20250728',
    'start_date': '2025-02-27',
    'end_date': '2025-07-28',
}


def export_consent_csv(name, start_date, end_date):
    params = {'start_date': start_date, 'end_date': end_date}
    print(f"Requesting consent data: {params}")
    resp = requests.get(API_URL, params=params)
    resp.raise_for_status()
    data = resp.json()
    if not data:
        print(f"No data for {name} ({start_date} to {end_date})")
        return

    # กำหนดชื่อไฟล์
    filename = f"consent_{name}.csv"
    print(f"Exporting {len(data)} rows to {filename}")
    
    # เขียนไฟล์ CSV
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    print(f"Exported {filename} successfully.")


def main():
    export_consent_csv(EXPORT_SINGLE['name'], EXPORT_SINGLE['start_date'], EXPORT_SINGLE['end_date'])

if __name__ == '__main__':
    main()
