const { useState, useEffect } = React;

const LoadingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center transform transition-all duration-300 ease-in-out">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
            <p className="text-gray-700 text-lg font-medium">Loading...</p>
        </div>
    </div>
);

function DashboardView({ data, chartData }) {
    if (!data) return null;

    useEffect(() => {
        if (!chartData || chartData.length === 0) return;

        // Create Consent Trends Chart
        const trendCtx = document.getElementById('consentTrends').getContext('2d');
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.date),
                datasets: [
                    {
                        label: 'Marketing Consent %',
                        data: chartData.map(d => d.marketing_consent_percentage),
                        borderColor: '#6366f1',
                        backgroundColor: '#6366f120',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Dropoff %',
                        data: chartData.map(d => d.dropoff_percentage),
                        borderColor: '#ef4444',
                        backgroundColor: '#ef444420',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => `${value}%`
                        }
                    }
                }
            }
        });

        // Create Total Consents Chart
        const totalCtx = document.getElementById('totalConsents').getContext('2d');
        new Chart(totalCtx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.date),
                datasets: [{
                    label: 'Total Consents',
                    data: chartData.map(d => d.total_consents),
                    borderColor: '#2563eb',
                    backgroundColor: '#2563eb20',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => new Intl.NumberFormat().format(value)
                        }
                    }
                }
            }
        });

        // Create Channel Distribution Pie Chart
        const channelCtx = document.getElementById('channelDistribution').getContext('2d');
        new Chart(channelCtx, {
            type: 'doughnut',
            data: {
                labels: ['F1', 'KP', 'GWL'],
                datasets: [{
                    data: [
                        data.f1_channel_consents,
                        data.kp_channel_consents,
                        data.gwl_channel_consents
                    ],
                    backgroundColor: [
                        '#ec4899', // pink-500
                        '#3b82f6', // blue-500
                        '#eab308'  // yellow-500
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                cutout: '65%'
            }
        });
    }, [chartData, data]);

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num);
    };

    const StatCard = ({ title, value, trend, color }) => (
        <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-200 hover:shadow-xl">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
            <div className="mt-2 flex items-baseline">
                <p className={`text-2xl font-semibold ${color}`}>{value}</p>
                {trend && (
                    <span className={`ml-2 text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-800">
                        <h2 className="text-2xl font-bold text-white">New User Registration Consent Dashboard</h2>
                        <p className="mt-1 text-blue-100">Real-time consent analytics overview</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <StatCard 
                        title="Total Consents"
                        value={formatNumber(data.total_consents)}
                        color="text-blue-600"
                    />
                    <StatCard 
                        title="Privacy Policy"
                        value={formatNumber(data.privacy_policy_consents)}
                        color="text-indigo-600"
                    />
                    <StatCard 
                        title="New Users"
                        value={formatNumber(data.new_users)}
                        color="text-purple-600"
                    />
                    <StatCard 
                        title="Marketing Consent"
                        value={formatNumber(data.marketing_consents)}
                        color="text-indigo-600"
                    />
                    <StatCard 
                        title="Marketing Rate"
                        value={`${data.marketing_consent_percentage ? data.marketing_consent_percentage.toFixed(2) : '0.00'}%`}
                        color="text-indigo-600"
                    />
                    <StatCard 
                        title="Dropoff Rate"
                        value={`${data.dropoff_percentage ? data.dropoff_percentage.toFixed(2) : '0.00'}%`}
                        color={data.dropoff_percentage < 30 ? 'text-green-600' : 'text-red-600'}
                    />
                </div>

                {/* Channel Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Channel Distribution</h3>
                        <div className="h-64">
                            <canvas id="channelDistribution"></canvas>
                        </div>
                        <div className="mt-4 space-y-4">
                            <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-pink-500 mr-2"></div>
                                <span className="text-gray-600 flex-1">F1</span>
                                <span className="text-lg font-semibold text-gray-900">{formatNumber(data.f1_channel_consents)}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                <span className="text-gray-600 flex-1">KP</span>
                                <span className="text-lg font-semibold text-gray-900">{formatNumber(data.kp_channel_consents)}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                                <span className="text-gray-600 flex-1">GWL</span>
                                <span className="text-lg font-semibold text-gray-900">{formatNumber(data.gwl_channel_consents)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">Consent Trends</h3>
                            <div className="h-64">
                                <canvas id="consentTrends"></canvas>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">Total Consents Per Day</h3>
                            <div className="h-64">
                                <canvas id="totalConsents"></canvas>
                            </div>
                        </div>
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${window.API_URL}/api/dashboard-summary`);
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

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await axios.get(`${window.API_URL}/api/daily-stats`);
                setChartData(response.data);
            } catch (error) {
                console.error('Error fetching chart data:', error);
            }
        };

        fetchChartData();
    }, []);

    if (loading) return <LoadingModal />;
    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-xl text-center">
                <div className="text-red-500 text-xl mb-2">Error</div>
                <p className="text-gray-600">{error}</p>
            </div>
        </div>
    );
    if (!data) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-xl text-center">
                <p className="text-gray-600">No data available</p>
            </div>
        </div>
    );

    return <DashboardView data={data} chartData={chartData} />;
}

window.DashboardContainer = DashboardContainer;
