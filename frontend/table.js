const { useState } = React;

function TableView({ data }) {
  if (!data) return null;

  // If data is an array (historical data), use it directly
  // Otherwise, wrap single day data in an array
  const tableData = Array.isArray(data) ? data : [data];

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Consents</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Privacy Policy</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marketing</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marketing %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F1 Channel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KP Channel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GWL Channel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dropoff</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dropoff %</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row, index) => (
              <tr key={row.date || index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.total_consents}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.privacy_policy_consents}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.marketing_consents}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.marketing_consent_percentage?.toFixed(2)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.f1_channel_consents}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.kp_channel_consents}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.gwl_channel_consents}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.dropoff_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.dropoff_percentage?.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableContainer() {
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:8001/api/historical-data`, {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-4 mb-8">
        <div className="flex items-center gap-2">
          <span>From:</span>
          <input
            type="date"
            min="2025-02-27"
            max={getTodayDate()}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span>To:</span>
          <input
            type="date"
            min={startDate}
            max={getTodayDate()}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          className="px-6 py-2 rounded-md text-white font-medium bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
          onClick={fetchHistoricalData}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <TableView data={data} />
    </div>
  );
}
