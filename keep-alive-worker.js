// Worker to keep Render app alive
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

addEventListener('scheduled', event => {
    event.waitUntil(handleScheduled(event.scheduledTime))
})

async function handleRequest(request) {
    console.log('Received request:', request.method, request.url)
    
    // Check if this is a test request
    if (request.url.endsWith('/test')) {
        console.log('Responding to test request')
        return new Response('Hello from worker! This is a test endpoint.', {
            status: 200,
            headers: {
                'Content-Type': 'text/plain'
            }
        })
    }
    
    // For other requests, return 404
    console.log('Unknown endpoint requested')
    return new Response('Not Found', {
        status: 404,
        headers: {
            'Content-Type': 'text/plain'
        }
    })
}

async function handleScheduled(time) {
    console.log('Keep-alive worker triggered at:', new Date(time).toISOString())
    console.log('Attempting to ping:', RENDER_APP_URL)
    
    // URL of your Render app
    const RENDER_APP_URL = 'https://consent-dashboard.onrender.com'
    
    try {
        // Make a request to keep the app alive
        const startTime = new Date()
        console.log('Starting ping request...')
        const response = await fetch(RENDER_APP_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'Keep-Alive Worker'
            }
        })
        const endTime = new Date()
        
        console.log('Ping response:', {
            status: response.status,
            statusText: response.statusText
        })
        
        console.log(`Request took ${endTime - startTime}ms`)
        
        // Log the response body
        const body = await response.text()
        console.log('Response body:', body.substring(0, 200))
        
        console.log('Request headers:', {
            headers: Array.from(response.headers.entries())
        })
        
        console.log('Worker execution completed successfully')
    } catch (error) {
        console.error('Error pinging Render app:', {
            message: error.message,
            stack: error.stack
        })
    }
}
