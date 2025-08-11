import React, { useState, useEffect } from 'react'

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [backendUrl] = useState('http://192.168.86.97:3121')

  useEffect(() => {
    // Test backend connectivity
    fetch(`${backendUrl}/api/status`)
      .then(res => res.json())
      .then(data => {
        setBackendStatus(`✅ ${data.status} (${data.version})`)
      })
      .catch(() => {
        setBackendStatus('❌ Backend not accessible')
      })
  }, [backendUrl])

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        background: 'rgba(255,255,255,0.1)',
        padding: '40px',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ 
          fontSize: '3em', 
          marginBottom: '10px',
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          🚀 MIRG
        </h1>
        <h2 style={{ 
          fontSize: '1.5em', 
          marginBottom: '30px',
          textAlign: 'center',
          fontWeight: 'normal',
          opacity: '0.9'
        }}>
          Multi-IDE Rules Generator
        </h2>
        
        <div style={{ 
          background: 'rgba(0,0,0,0.2)', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: '0', marginBottom: '15px' }}>🔧 System Status</h3>
          <p style={{ margin: '5px 0' }}>
            <strong>Frontend:</strong> ✅ React App Running
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Backend:</strong> {backendStatus}
          </p>
          <p style={{ margin: '5px 0', fontSize: '0.9em', opacity: '0.8' }}>
            <strong>Deployment:</strong> Portainer + Git Repository
          </p>
        </div>

        <div style={{ 
          background: 'rgba(0,0,0,0.2)', 
          padding: '20px', 
          borderRadius: '10px'
        }}>
          <h3 style={{ marginTop: '0', marginBottom: '15px' }}>📋 Features</h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Multi-IDE rule package generation</li>
            <li>Hybrid SaaS/CLI platform</li>
            <li>Vector database integration</li>
            <li>Real-time rule management</li>
            <li>Cross-platform compatibility</li>
          </ul>
        </div>

        <div style={{ 
          textAlign: 'center',
          marginTop: '30px',
          fontSize: '0.9em',
          opacity: '0.7'
        }}>
          <p>Deployed via Portainer • Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}

export default App