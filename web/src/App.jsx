import Dashboard from './pages/Dashboard'
import SOSHistory from './pages/SOSHistory'
import { useState } from 'react'
import './App.css'

function App() {
  const [page, setPage] = useState('dashboard')
  const [selectedSOS, setSelectedSOS] = useState(null)
  const [selectedHospitalId, setSelectedHospitalId] = useState(null)

  const openSosHistory = (sos) => {
    setSelectedSOS(sos || null)
    setPage('soshistory')
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1>🏥 Яаралтай Тусламж</h1>
        <ul className="nav-menu">
          <li className="nav-item">
            <div className={`nav-link ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>📍 Газрын Зураг</div>
          </li>
          <li className="nav-item">
            <div className={`nav-link ${page === 'soshistory' ? 'active' : ''}`} onClick={() => setPage('soshistory')}>📜 SOS Түүх</div>
          </li>
        </ul>

        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <p style={{ fontSize: '12px', opacity: 0.7 }}>Сервер: {navigator.onLine ? '🟢 Холбогдсон' : '🔴 Салгарсан'}</p>
          <p style={{ fontSize: '12px', opacity: 0.75, marginTop: '10px', lineHeight: 1.4 }}>
            SOS дуудлагууд доорх самбарт эрэмбэлэгдэн харагдана. Аппын серверийн хаяг: config/api.js болон EXPO_PUBLIC_API_URL.
          </p>
          <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>© 2026 Emergency System</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <h2>📍 Газрын Зураг ба Эмнэлэгүүд</h2>
          <div className="header-info">
            <span>🕐 {new Date().toLocaleTimeString('mn-MN')}</span>
          </div>
        </header>

        <div className="content-area">
          {page === 'dashboard' && (
            <Dashboard onOpenSOS={(sos) => openSosHistory(sos)} />
          )}
          {page === 'soshistory' && (
            <SOSHistory
              sos={selectedSOS}
              onBack={() => setPage('dashboard')}
              onSelectHospital={(id) => setSelectedHospitalId(id)}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
