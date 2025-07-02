const { useState, useEffect } = React;

const LoadingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center transform transition-all duration-300 ease-in-out">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
            <p className="text-gray-700 text-lg font-medium">Loading...</p>
        </div>
    </div>
);

const PaginationControls = ({ currentPage, totalItems, displayCount, onPageChange }) => (
    <div className="flex justify-between items-center">
        <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * displayCount + 1} to {Math.min(currentPage * displayCount, totalItems)} of {totalItems} entries
        </div>
        <div className="flex space-x-2">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
                Previous
            </button>
            <button
                onClick={() => onPageChange(Math.min(Math.ceil(totalItems / displayCount), currentPage + 1))}
                disabled={currentPage >= Math.ceil(totalItems / displayCount)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
                Next
            </button>
        </div>
    </div>
);

function TableView() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            const response = await axios.get(`${window.API_URL}/api/all-consent-data`);
            
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
                    dropoff_percentage: null,
                    new_users: null
                };
            });
            
            setData(fullData);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // ฟังก์ชันสำหรับ fetch ข้อมูลของวันที่เดียว
    const fetchSingleDate = async (date) => {
        try {
            setLoading(true);
            // เรียก API เพื่อดึงข้อมูล
            const response = await axios.post(`${window.API_URL}/api/manual-fetch/${date}`);
            
            if (response.status === 200) {
                console.log("Fetch successful:", response.data);
                
                // รอสักครู่เพื่อให้ backend มีเวลาประมวลผลข้อมูล
                setTimeout(async () => {
                    try {
                        // ดึงข้อมูลเฉพาะวันที่ต้องการ
                        const dataResponse = await axios.get(`${window.API_URL}/api/consent-data/${date}`);
                        
                        if (dataResponse.status === 200) {
                            // อัปเดตข้อมูลในตาราง
                            setData(prevData => {
                                const newData = [...prevData];
                                const index = newData.findIndex(item => item.date === date);
                                if (index !== -1) {
                                    newData[index] = dataResponse.data;
                                }
                                return newData;
                            });
                        } else {
                            // ถ้าไม่สามารถดึงข้อมูลเฉพาะวันได้ ให้ดึงข้อมูลทั้งหมดใหม่
                            await fetchData();
                        }
                    } catch (err) {
                        console.error("Error fetching updated data:", err);
                        // ถ้าเกิดข้อผิดพลาด ให้ดึงข้อมูลทั้งหมดใหม่
                        await fetchData();
                    } finally {
                        setLoading(false);
                    }
                }, 1000); // รอ 1 วินาที
            } else {
                throw new Error('Failed to fetch data');
            }
        } catch (error) {
            console.error('Error fetching data for date:', error);
            setLoading(false);
        }
    };

    // ฟังก์ชันตรวจสอบว่าควรแสดงปุ่ม Fetch หรือไม่
    const shouldShowFetchButton = (date, row) => {
        // ไม่แสดงปุ่มสำหรับวันล่าสุด
        const today = new Date().toISOString().split('T')[0];
        if (date === today) return false;

        // แสดงปุ่มเฉพาะวันที่ไม่มีข้อมูล (total_consents เป็น null)
        return !row.total_consents;
    };

    // ฟังก์ชันสำหรับแสดงปุ่ม Fetch
    const renderFetchButton = (date) => {
        return (
            <button
                onClick={() => fetchSingleDate(date)}
                className={`px-3 py-1 text-white rounded ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                } bg-blue-500`}
                disabled={loading}
            >
                {loading ? 'Fetching...' : 'Fetch'}
            </button>
        );
    };

    const formatDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const formatNumber = (num) => {
        return num ? num.toLocaleString() : '-';
    };

    // คำนวณข้อมูลที่จะแสดงในหน้าปัจจุบัน
    const totalPages = Math.ceil(data.length / displayCount);
    const startIndex = (currentPage - 1) * displayCount;
    const displayData = data.slice(startIndex, startIndex + displayCount);

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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header Section */}
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-800">
                        <h2 className="text-2xl font-bold text-white">New User Registration Consent Data</h2>
                        <p className="mt-1 text-blue-100">Historical consent data overview</p>
                    </div>

                    {/* Controls Section */}
                    <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <div className="text-sm text-gray-700">
                            Showing {(currentPage - 1) * displayCount + 1} to {Math.min(currentPage * displayCount, data.length)} of {data.length} entries
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="relative w-40">
                                <select
                                    value={displayCount}
                                    onChange={(e) => setDisplayCount(Number(e.target.value))}
                                    className="w-full appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
                                >
                                    <option value="10">10 rows</option>
                                    <option value="20">20 rows</option>
                                    <option value="50">50 rows</option>
                                    <option value="100">100 rows</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(data.length / displayCount), p + 1))}
                                    disabled={currentPage >= Math.ceil(data.length / displayCount)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Consents</th>
                                    <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Privacy Policy</th>
                                    <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Marketing</th>
                                    <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Marketing %</th>
                                    <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">F1</th>
                                    <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">KP</th>
                                    <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">GWL</th>
                                    <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider" title="Users with multiple profiles">Multiple Profiles</th>
                                    {/* <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Dropoffs</th> */}
                                    {/* <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Dropoff %</th>
                                    <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">New Users</th> */}
                                    <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {displayData.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(row.date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatNumber(row.total_consents)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.privacy_policy_consents)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.marketing_consents)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                            <span className={`px-2 py-1 rounded-full ${row.marketing_consent_percentage > 50 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {row.marketing_consent_percentage ? `${row.marketing_consent_percentage.toFixed(2)}%` : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.f1_channel_consents)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.kp_channel_consents)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.gwl_channel_consents)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.dropoff_count)}</td>
                                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                            <span className={`px-2 py-1 rounded-full ${row.dropoff_percentage < 30 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {row.dropoff_percentage ? `${row.dropoff_percentage.toFixed(2)}%` : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.new_users)}</td> */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                            {shouldShowFetchButton(row.date, row) && renderFetchButton(row.date)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Pagination Section */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <PaginationControls
                            currentPage={currentPage}
                            totalItems={data.length}
                            displayCount={displayCount}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            </div>
            {loading && <LoadingModal />}
        </div>
    );
}

function TableContainer() {
    return <TableView />;
}

window.TableContainer = TableContainer;
