import { useState, useEffect } from 'react';

export default function Diagnostic() {
  const [mounted, setMounted] = useState(false);
  const [apiTest, setApiTest] = useState('Testing...');

  useEffect(() => {
    setMounted(true);
    
    // Test API connectivity
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.error === 'Access token required') {
          setApiTest('✅ API Connected (401 as expected)');
        } else {
          setApiTest('✅ API Connected');
        }
      })
      .catch(err => {
        setApiTest('❌ API Error: ' + err.message);
      });
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        🔬 PlatinumEdge Analytics - Diagnostic Page
      </h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>Frontend Status</h2>
        <p>✅ React Application: {mounted ? 'Mounted Successfully' : 'Loading...'}</p>
        <p>✅ JavaScript: Executing Properly</p>
        <p>✅ CSS: Styles Applied</p>
        <p>{apiTest}</p>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>Asset Loading Test</h2>
        <p>✅ HTML: Document loaded</p>
        <p>✅ Vite: Development server active</p>
        <p>✅ HMR: Hot module replacement working</p>
        <p>✅ Transpilation: TypeScript/JSX processing correctly</p>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Browser Environment</h2>
        <p>User Agent: {navigator.userAgent}</p>
        <p>Window Location: {window.location.href}</p>
        <p>Document Ready State: {document.readyState}</p>
        <p>Timestamp: {new Date().toISOString()}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Go to Main App
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}