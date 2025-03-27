function DashboardView({ data }) {
  if (!data) return null;

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Consent Overview</h3>
          <div className="space-y-2">
            <p>Total Consents: {data.total_consents}</p>
            <p>Privacy Policy: {data.privacy_policy_consents}</p>
            <p>Marketing: {data.marketing_consents}</p>
            <p>Marketing Consent Rate: {data.marketing_consent_percentage?.toFixed(2)}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Channel Distribution</h3>
          <div className="space-y-2">
            <p>F1: {data.f1_channel_consents}</p>
            <p>KP: {data.kp_channel_consents}</p>
            <p>GWL: {data.gwl_channel_consents}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Dropoff Analysis</h3>
          <div className="space-y-2">
            <p>Dropoff Count: {data.dropoff_count}</p>
            <p>Dropoff Rate: {data.dropoff_percentage?.toFixed(2)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const DashboardContainer = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <DashboardView data={data} />;
}

window.DashboardContainer = DashboardContainer;
