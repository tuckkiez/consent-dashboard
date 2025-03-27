const { useState, useEffect } = React;

function TableView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data...');
      const response = await axios.get('http://localhost:8001/api/all-consent-data');
      console.log('Raw response:', response);
      console.log('Response data:', response.data);
      if (Array.isArray(response.data)) {
        setData(response.data);
      } else {
        console.error('Response data is not an array:', response.data);
        setData([]);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  if (!data || data.length === 0) return <div className="p-4">-</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Consent Data Table</h2>
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
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="px-4 py-2 border">{row.date}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableContainer() {
  return <TableView />;
}
