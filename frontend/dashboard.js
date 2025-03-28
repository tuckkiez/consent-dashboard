const { useState, useEffect } = React;

function DashboardView({ data, chartData }) {
  if (!data) return null;

  useEffect(() => {
    if (!chartData || chartData.length === 0) return;

    // สร้างกราฟ Consent Trends
    const trendCtx = document.getElementById('consentTrends').getContext('2d');
    new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: chartData.map(d => d.date),
        datasets: [
          {
            label: 'Marketing Consent %',
            data: chartData.map(d => d.marketing_consent_percentage),
            borderColor: '#8884d8',
            tension: 0.1
          },
          {
            label: 'Dropoff %',
            data: chartData.map(d => d.dropoff_percentage),
            borderColor: '#82ca9d',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

    // สร้างกราฟ Total Consents
    const totalCtx = document.getElementById('totalConsents').getContext('2d');
    new Chart(totalCtx, {
      type: 'line',
      data: {
        labels: chartData.map(d => d.date),
        datasets: [{
          label: 'Total Consents',
          data: chartData.map(d => d.total_consents),
          borderColor: '#ff7300',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }, [chartData]);

  // Format numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-6 font-bold text-gray-800" >Consent Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Consent Overview Card */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Consent Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Consents:</span>
              <span className="text-2xl font-bold text-blue-600">{formatNumber(data.total_consents)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Privacy Policy:</span>
              <span className="text-xl font-semibold text-green-600">{formatNumber(data.privacy_policy_consents)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Marketing:</span>
              <span className="text-xl font-semibold text-purple-600">{formatNumber(data.marketing_consents)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Marketing Rate:</span>
              <span className="text-xl font-semibold text-indigo-600">
                {data.marketing_consent_percentage ? data.marketing_consent_percentage.toFixed(2) : '0.00'}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Users:</span>
              <span className="text-xl font-semibold text-purple-600">{formatNumber(data.new_users)}</span>
            </div>
          </div>
        </div>

        {/* Channel Distribution Card */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Channel Distribution</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">F1:</span>
              <span className="text-xl font-semibold text-pink-600">{formatNumber(data.f1_channel_consents)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">KP:</span>
              <span className="text-xl font-semibold text-blue-600">{formatNumber(data.kp_channel_consents)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">GWL:</span>
              <span className="text-xl font-semibold text-yellow-600">{formatNumber(data.gwl_channel_consents)}</span>
            </div>
          </div>
          <div className="mt-4 h-48">
            <canvas id="channelDistribution"></canvas>
          </div>
        </div>

        {/* Dropoff Analysis Card */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Dropoff Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dropoff Count:</span>
              <span className="text-2xl font-bold text-red-600">{formatNumber(data.dropoff_count)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dropoff Rate:</span>
              <span className="text-xl font-semibold text-orange-600">
                {data.dropoff_percentage ? data.dropoff_percentage.toFixed(2) : '0.00'}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* กราฟ Consent Trends และ Total Consents */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* กราฟ Consent Trends */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Consent Trends</h3>
          <div style={{ height: '300px' }}>
            <canvas id="consentTrends"></canvas>
          </div>
        </div>

        {/* กราฟ Total Consents */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Total Consents by Day</h3>
          <div style={{ height: '300px' }}>
            <canvas id="totalConsents"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardContainer() {
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard summary
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8001/api/dashboard-summary');
        setData(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await axios.get('http://localhost:8001/api/daily-stats');
        setChartData(response.data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!data) return <div className="p-4">No data available</div>;

  return <DashboardView data={data} chartData={chartData} />;
}

window.DashboardContainer = DashboardContainer;
