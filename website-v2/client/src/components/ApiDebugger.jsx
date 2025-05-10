// client/src/components/ApiDebugger.jsx

import React, { useState, useEffect } from 'react';
import { testApiConnection } from '../services/api';
import config from '../config';

/**
 * API Debugger Component
 * 
 * A utility component for debugging API connection issues.
 * This can be temporarily added to your app during development.
 */
const ApiDebugger = () => {
  const [connectionStatus, setConnectionStatus] = useState('Not tested');
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const runTest = async () => {
    setLoading(true);
    setConnectionStatus('Testing...');
    
    try {
      const result = await testApiConnection();
      setTestResult(result);
      setConnectionStatus(result.success ? 'Connected' : 'Failed');
    } catch (error) {
      setTestResult({ 
        success: false,
        error: error.message,
        details: 'Unexpected error during test'
      });
      setConnectionStatus('Error');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Run an initial test on component mount
    runTest();
  }, []);
  
  // Skip rendering in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      zIndex: 9999,
      background: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: 4,
      padding: expanded ? 15 : 5,
      fontFamily: 'monospace',
      fontSize: 12,
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      maxWidth: expanded ? 500 : 180,
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: expanded ? 10 : 0,
        cursor: 'pointer'
      }} onClick={() => setExpanded(!expanded)}>
        <strong>API Status: {" "}
          <span style={{
            color: connectionStatus === 'Connected' ? 'green' : 
                  connectionStatus === 'Testing...' ? 'blue' : 'red'
          }}>
            {connectionStatus}
          </span>
        </strong>
        <button style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 16
        }}>
          {expanded ? '▼' : '▲'}
        </button>
      </div>
      
      {/* Expanded content */}
      {expanded && (
        <div>
          <div style={{ marginBottom: 10 }}>
            <div><strong>API URL:</strong> {config.apiUrl}</div>
            <div><strong>Mock Data:</strong> {config.useMockData ? 'Enabled' : 'Disabled'}</div>
            <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
          </div>
          
          <button 
            onClick={runTest} 
            disabled={loading}
            style={{
              padding: '5px 10px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
          
          {testResult && (
            <div style={{
              marginTop: 10,
              padding: 10,
              background: testResult.success ? '#e6ffe6' : '#ffe6e6',
              borderRadius: 4,
              maxHeight: 300,
              overflow: 'auto'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
          
          <div style={{ marginTop: 10, fontSize: 11, color: '#666' }}>
            <strong>Debug Tips:</strong>
            <ul style={{ margin: 5, paddingLeft: 20 }}>
              <li>Check if backend is running</li>
              <li>Verify API URL is correct</li>
              <li>Look for CORS errors in console</li>
              <li>Check network tab in DevTools</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiDebugger;