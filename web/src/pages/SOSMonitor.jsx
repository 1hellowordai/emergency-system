import { useState, useEffect } from 'react'
import { emergencyAPI, hospitalAPI } from '../api'

export default function SOSMonitor() {
  const [sosCalls, setSosCalls] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchData()
    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [sos, hosp] = await Promise.all([emergencyAPI.getAll(), hospitalAPI.getAll()])
    setSosCalls(sos)
    setHospitals(hosp)
    setLoading(false)
  }

  const getHospitalName = (hospitalId) => {
    const hospital = hospitals.find((h) => h.id === hospitalId)
    return hospital?.name || 'Unknown'
  }

  const getTimeDifference = (createdAt) => {
    const now = new Date()
    const callTime = new Date(createdAt)
    const diff = Math.floor((now - callTime) / 1000)

    if (diff < 60) return `${diff} сек`
    if (diff < 3600) return `${Math.floor(diff / 60)} мин`
    return `${Math.floor(diff / 3600)} цаг`
  }

  const filteredCalls = sosCalls.filter((call) => {
    if (filter === 'pending') return call.status === 'Pending'
    if (filter === 'inprogress') return call.status === 'On the Way'
    if (filter === 'completed') return call.status === 'Completed'
    return true
  })

  if (loading && sosCalls.length === 0) {
    return <div className="loading">SOS дуудлагуудыг ачаалж байна...</div>
  }

  const pendingCount = sosCalls.filter((c) => c.status === 'Pending').length
  const inProgressCount = sosCalls.filter((c) => c.status === 'On the Way').length
  const completedCount = sosCalls.filter((c) => c.status === 'Completed').length

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#ff1744' }}>
            {pendingCount}
          </div>
          <div className="stat-label">Хүлээгдэж буй</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#ff9800' }}>
            {inProgressCount}
          </div>
          <div className="stat-label">Явах замдаа</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#4caf50' }}>
            {completedCount}
          </div>
          <div className="stat-label">Дөчилсөн</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{sosCalls.length}</div>
          <div className="stat-label">Нийт дуудлага</div>
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: filter === 'all' ? '#1f57ff' : '#e0e0e0',
            color: filter === 'all' ? 'white' : '#333',
            fontWeight: '500',
          }}
        >
          Бүгд ({sosCalls.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: filter === 'pending' ? '#ff1744' : '#e0e0e0',
            color: filter === 'pending' ? 'white' : '#333',
            fontWeight: '500',
          }}
        >
          Хүлээгдэж буй ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('inprogress')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: filter === 'inprogress' ? '#ff9800' : '#e0e0e0',
            color: filter === 'inprogress' ? 'white' : '#333',
            fontWeight: '500',
          }}
        >
          Явах замдаа ({inProgressCount})
        </button>
      </div>

      <div className="sos-list">
        {filteredCalls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Дуудлага байхгүй байна
          </div>
        ) : (
          filteredCalls.map((call) => (
            <div key={call.id} className="sos-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div className="sos-urgency">🚨 {call.type || 'SOS'}</div>
                  <div className="sos-location">
                    📍 Байршил: {call.latitude.toFixed(6)}, {call.longitude.toFixed(6)}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                    <strong>Статус:</strong>{' '}
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor:
                          call.status === 'Pending'
                            ? '#ffe0e0'
                            : call.status === 'On the Way'
                              ? '#fff3e0'
                              : '#e8f5e9',
                        color:
                          call.status === 'Pending'
                            ? '#c62828'
                            : call.status === 'On the Way'
                              ? '#e65100'
                              : '#2e7d32',
                      }}
                    >
                      {call.status}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="sos-time">{getTimeDifference(call.created_at)} өмнө</div>
                  {call.user_id && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                      Хэрэглэгч: {call.user_id}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
