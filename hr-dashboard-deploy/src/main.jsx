import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

function Fallback({ error }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: '#e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'sans-serif',
    }}>
      <div style={{ maxWidth: 480 }}>
        <h2 style={{ marginBottom: 12, color: '#f1f5f9' }}>오류가 발생했습니다</h2>
        <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 8, fontSize: 12, overflow: 'auto' }}>
          {error?.message || String(error)}
        </pre>
      </div>
    </div>
  )
}

class ErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) return <Fallback error={this.state.error} />
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
