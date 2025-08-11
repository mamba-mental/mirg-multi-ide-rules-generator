import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100'

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [backendHealth, setBackendHealth] = useState('Checking...')

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const statusResponse = await axios.get(`${API_URL}/api/status`)
        setBackendStatus(statusResponse.data.status || 'Connected')
        
        const healthResponse = await axios.get(`${API_URL}/health`)
        setBackendHealth(healthResponse.data.status || 'Healthy')
      } catch (error) {
        setBackendStatus('Disconnected')
        setBackendHealth('Unhealthy')
        console.error('Backend connection failed:', error)
      }
    }

    checkBackend()
    const interval = setInterval(checkBackend, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎯 MIRG
            </h1>
            <p className="text-gray-600 mb-8">
              Multi-IDE Rules Generator
            </p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  System Status
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Backend:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      backendStatus.includes('Running') || backendStatus.includes('Connected')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {backendStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Health:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      backendHealth === 'healthy' || backendHealth === 'Healthy'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {backendHealth}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Frontend: Running on Vite + React</p>
                <p>API URL: {API_URL}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App