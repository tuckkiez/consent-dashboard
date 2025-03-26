function DashboardView({ data }) {
  if (!data) return null;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Consents</h3>
          <p className="text-3xl font-bold text-blue-600" id="totalConsents">{data.total_count}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Privacy Policy Consents</h3>
          <p className="text-3xl font-bold text-green-600" id="privacyPolicyConsents">{data.privacy_policy_count}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Marketing Consents</h3>
          <p className="text-3xl font-bold text-purple-600" id="marketingConsents">{data.marketing_count}</p>
          <p className="text-sm text-gray-600 mt-2" id="marketingConsentPercentageText">
            <span id="marketingConsentPercentage">{data.marketing_consent_percentage?.toFixed(2)}</span>% of Total Consents
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">F1 Channel</h3>
          <p className="text-3xl font-bold text-indigo-600" id="f1ChannelConsents">{data.f1_channel_count}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">KP Channel</h3>
          <p className="text-3xl font-bold text-pink-600" id="kpChannelConsents">{data.kp_channel_count}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">GWL Channel</h3>
          <p className="text-3xl font-bold text-yellow-600" id="gwlChannelConsents">{data.gwl_channel_count}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Dropoff</h3>
          <p className="text-3xl font-bold text-red-600" id="dropoffCount">{data.dropoff_count}</p>
          <p className="text-sm text-gray-600 mt-2" id="dropoffPercentageText">
            <span id="dropoffPercentage">{data.dropoff_percentage?.toFixed(2)}</span>% of Total Consents
          </p>
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
      <div className="flex gap-4 mb-8">
        <input
          type="date"
          min="2025-02-27"
          max={getTodayDate()}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="px-6 py-2 rounded-md text-white font-medium bg-blue-500 hover:bg-blue-600"
          onClick={fetchData}
        >
          Fetch Data
        </button>
      </div>
      <DashboardView data={data} />
    </div>
  );
}
