const { useState, useEffect } = React;

const LoadingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700">Loading data...</p>
        </div>
    </div>
);

function TableView() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [displayCount, setDisplayCount] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    const minDate = "2025-02-27";
    const maxDate = new Date().toISOString().split('T')[0];

    // สร้างอาเรย์ของวันที่ทั้งหมดตั้งแต่ 27/02/2025 ถึงปัจจุบัน
    const generateDateRange = () => {
        const dates = [];
        const start = new Date('2025-02-27');
        const end = new Date();
        
        for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
            dates.push(new Date(date).toISOString().split('T')[0]);
        }
        // เรียงวันที่จากใหม่ไปเก่า
        return dates.reverse();
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setCurrentPage(1); // รีเซ็ตหน้าเมื่อเปลี่ยนจำนวนวันที่แสดง
    }, [displayCount]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8001/api/all-consent-data');
            
            // สร้าง map ของข้อมูลที่มีอยู่
            const dataMap = new Map(response.data.map(item => [item.date, item]));
            
            // สร้างข้อมูลสำหรับทุกวัน เรียงจากใหม่ไปเก่า
            const allDates = generateDateRange();
            const fullData = allDates.map(date => {
                return dataMap.get(date) || {
                    date,
                    total_consents: null,
                    privacy_policy_consents: null,
                    marketing_consents: null,
                    marketing_consent_percentage: null,
                    f1_channel_consents: null,
                    kp_channel_consents: null,
                    gwl_channel_consents: null,
                    dropoff_count: null,
                    dropoff_percentage: null
                };
            });
            
            setData(fullData);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSingleDate = async (date) => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8001/api/consent-data/${date}`);
            
            // อัพเดทข้อมูลของวันที่เลือก
            setData(prevData => {
                const newData = [...prevData];
                const index = newData.findIndex(item => item.date === date);
                if (index !== -1) {
                    newData[index] = response.data;
                }
                return newData;
            });
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    // คำนวณข้อมูลที่จะแสดงในหน้าปัจจุบัน
    const totalPages = Math.ceil(data.length / displayCount);
    const startIndex = (currentPage - 1) * displayCount;
    const displayData = data.slice(startIndex, startIndex + displayCount);

    // เพิ่มฟังก์ชันเช็คว่าควรแสดงปุ่ม Fetch หรือไม่
    const shouldShowFetchButton = (date) => {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // วันปัจจุบันแสดงปุ่มเสมอ
        if (date === today) {
            return 'today';
        }
        
        // วันก่อนหน้า แสดงปุ่มเฉพาะเมื่อยังไม่มีข้อมูล
        const yesterdayData = data.find(row => row.date === date);
        if (date === yesterdayStr && (!yesterdayData || !yesterdayData.total_consents)) {
            return 'yesterday';
        }

        // วันอื่นๆ แสดงปุ่มเมื่อไม่มีข้อมูล
        const rowData = data.find(row => row.date === date);
        if (!rowData || !rowData.total_consents) {
            return 'other';
        }

        return null;
    };

    // เพิ่มฟังก์ชันสำหรับข้อความบนปุ่ม
    const getFetchButtonText = (buttonType, isLoading) => {
        if (isLoading) return 'Loading...';
        
        switch (buttonType) {
            case 'today':
                return 'Refresh Now';
            case 'yesterday':
                return 'Fetch Yesterday';
            default:
                return 'Fetch';
        }
    };

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            {loading && <LoadingModal />}
            
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Consent Data Table</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Show:</label>
                        <select
                            value={displayCount}
                            onChange={(e) => setDisplayCount(Number(e.target.value))}
                            className="border rounded px-2 py-1"
                        >
                            <option value={10}>10 days</option>
                            <option value={20}>20 days</option>
                            <option value={50}>50 days</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 border">Date</th>
                            <th className="px-4 py-2 border">Total Consents</th>
                            <th className="px-4 py-2 border">Privacy Policy Consents</th>
                            <th className="px-4 py-2 border">Marketing Consents</th>
                            <th className="px-4 py-2 border">Marketing Consent %</th>
                            <th className="px-4 py-2 border">F1 Channel</th>
                            <th className="px-4 py-2 border">KP Channel</th>
                            <th className="px-4 py-2 border">GWL Channel</th>
                            <th className="px-4 py-2 border">Dropoff Count</th>
                            <th className="px-4 py-2 border">Dropoff %</th>
                            <th className="px-4 py-2 border">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.map((row, index) => {
                            const buttonType = shouldShowFetchButton(row.date);
                            return (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                    <td className="px-4 py-2 border">{formatDate(row.date)}</td>
                                    <td className="px-4 py-2 border text-right">{row.total_consents || '-'}</td>
                                    <td className="px-4 py-2 border text-right">{row.privacy_policy_consents || '-'}</td>
                                    <td className="px-4 py-2 border text-right">{row.marketing_consents || '-'}</td>
                                    <td className="px-4 py-2 border text-right">
                                        {row.marketing_consent_percentage ? `${row.marketing_consent_percentage.toFixed(2)}%` : '-'}
                                    </td>
                                    <td className="px-4 py-2 border text-right">{row.f1_channel_consents || '-'}</td>
                                    <td className="px-4 py-2 border text-right">{row.kp_channel_consents || '-'}</td>
                                    <td className="px-4 py-2 border text-right">{row.gwl_channel_consents || '-'}</td>
                                    <td className="px-4 py-2 border text-right">{row.dropoff_count || '-'}</td>
                                    <td className="px-4 py-2 border text-right">
                                        {row.dropoff_percentage ? `${row.dropoff_percentage.toFixed(2)}%` : '-'}
                                    </td>
                                    <td className="px-4 py-2 border text-center">
                                        {buttonType && (
                                            <button
                                                onClick={() => fetchSingleDate(row.date)}
                                                className={`px-3 py-1 text-white rounded disabled:opacity-50 ${
                                                    buttonType === 'today'
                                                        ? 'bg-green-500 hover:bg-green-600'  // วันปัจจุบัน
                                                        : buttonType === 'yesterday'
                                                        ? 'bg-yellow-500 hover:bg-yellow-600'  // วันก่อนหน้า
                                                        : 'bg-blue-500 hover:bg-blue-600'  // วันอื่นๆ
                                                }`}
                                                disabled={loading}
                                            >
                                                {getFetchButtonText(buttonType, loading)}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TableContainer() {
    return <TableView />;
}

window.TableContainer = TableContainer;
