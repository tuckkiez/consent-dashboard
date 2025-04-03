// Worker to keep Render app alive
addEventListener('scheduled', event => {
    event.waitUntil(handleScheduled(event.scheduledTime))
})

async function handleScheduled(time) {
    console.log('Keep-alive worker triggered at:', new Date(time).toISOString())
    
    // URL of your Render app
    const RENDER_APP_URL = 'https://consent-dashboard.onrender.com'
    
    try {
        // Make a request to keep the app alive
        const response = await fetch(RENDER_APP_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'Keep-Alive Worker'
            }
        })
        
        console.log('Ping response:', {
            status: response.status,
            statusText: response.statusText
        })
    } catch (error) {
        console.error('Error pinging Render app:', error)
    }
}
