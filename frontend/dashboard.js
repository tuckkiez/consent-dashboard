const { useState, useEffect } = React;

function DashboardView({ data }) {
  if (!data) return null;

  useEffect(() => {
    // Line Chart - Consent Trends
    const consentCtx = document.getElementById('consentTrends');
    if (consentCtx) {
      new Chart(consentCtx, {
        type: 'line',
        data: {
          labels: ['Total', 'Privacy', 'Marketing'],
          datasets: [{
            label: 'Consents',
            data: [data.total_consents, data.privacy_policy_consents, data.marketing_consents],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        }
      });
    }

    // Pie Chart - Channel Distribution
    const channelCtx = document.getElementById('channelDistribution');
    if (channelCtx) {
      new Chart(channelCtx, {
        type: 'pie',
        data: {
          labels: ['F1', 'KP', 'GWL'],
          datasets: [{
            data: [data.f1_channel_consents, data.kp_channel_consents, data.gwl_channel_consents],
            backgroundColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 205, 86)'
            ]
          }]
        }
      });
    }
  }, [data]);

  // Format numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Consent Dashboard</h2>
      
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

      {/* Consent Trends Chart */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Consent Trends</h3>
        <div className="h-64">
          <canvas id="consentTrends"></canvas>
        </div>
      </div>
    </div>
  );
}

function DashboardContainer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!data) return <div className="p-4">No data available</div>;

  return <DashboardView data={data} />;
}

window.DashboardContainer = DashboardContainer;
