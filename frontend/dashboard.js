function DashboardView({ data }) {
  if (!data) return null;

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="mr-2">Select Date:</label>
        <input
          type="date"
          min="2025-02-27"
          max={getTodayDate()}
          className="border rounded p-1"
          value={getTodayDate()}
          onChange={(e) => console.log(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Consent Overview</h3>
          <div className="space-y-2">
            <p>Total Consents: {data.total_count}</p>
            <p>Privacy Policy: {data.privacy_policy_count}</p>
            <p>Marketing: {data.marketing_count}</p>
            <p>Marketing Consent Rate: {data.marketing_consent_percentage?.toFixed(2)}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Channel Distribution</h3>
          <div className="space-y-2">
            <p>F1: {data.f1_channel_count}</p>
            <p>KP: {data.kp_channel_count}</p>
            <p>GWL: {data.gwl_channel_count}</p>
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

function DashboardContainer() {
  const [data, setData] = React.useState(null);
  const [date, setDate] = React.useState(getTodayDate());

  const fetchData = async () => {
    try {
      const response = await axios.get(`http://localhost:8001/api/consent-data/${date}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [date]);

  return (
    <div>
      <DashboardView data={data} />
    </div>
  );
}
