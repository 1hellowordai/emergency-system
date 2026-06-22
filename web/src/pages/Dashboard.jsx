import { useState, useEffect, useMemo, useRef } from 'react'
import { hospitalAPI, emergencyAPI } from '../api'
import HospitalMap from '../components/HospitalMap'

function sortSosCalls(calls) {
  return [...calls].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

function StatCard({ icon, label, value, variant = 'default', valueIsText = false }) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      <div className="stat-card-top">
        <div className={`stat-icon`}>{icon}</div>
        <div className={valueIsText ? 'stat-number stat-number--text' : 'stat-number'}>
          {value}
        </div>
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function Dashboard({ onOpenSOS }) {
  const [hospitals, setHospitals] = useState([])
  const [sosCalls, setSosCalls] = useState([])
  const [ambulances, setAmbulances] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [selectedSOS, setSelectedSOS] = useState(null)
  const [showBusyAlert, setShowBusyAlert] = useState(false)
  const [busyAlertMessage, setBusyAlertMessage] = useState('')
  const sosSectionRef = useRef(null)

  const heavyTypes = new Set([
    'Ухаан алдах',
    'Осол',
    'Амьсгал боогдох',
    'Цус алдах',
    'Сэтгэл зүрхний өвдөлт',
    'Ноцтой гэмтэл',
    'Stroke',
    'Heart Attack',
    'Severe Trauma',
    'Fire',
  ])

  const getCallCategory = (sos) => {
    if (sos?.triage) {
      return sos.triage === 'heavy' ? 'Хүнд' : 'Хөнгөн'
    }
    if (heavyTypes.has(sos?.type)) {
      return 'Хүнд'
    }
    return 'Хөнгөн'
  }

  const sortedSosCalls = useMemo(() => {
    return sortSosCalls(sosCalls).sort((a, b) => {
      const aCat = getCallCategory(a) === 'Хүнд' ? 0 : 1
      const bCat = getCallCategory(b) === 'Хүнд' ? 0 : 1
      if (aCat !== bCat) return aCat - bCat
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [sosCalls])

  const fleetStats = useMemo(() => {
    let available = 0
    let onCall = 0
    hospitals.forEach((h) => {
      ;(h.Ambulances || []).forEach((a) => {
        if (a.status === 'Available') available += 1
        else if (a.status === 'On Call') onCall += 1
      })
    })
    return { available, onCall }
  }, [hospitals])

  const activeSosCount = useMemo(
    () =>
      sosCalls.filter((c) => c.status === 'Pending' || c.status === 'On the Way').length,
    [sosCalls]
  )

  const hospitalNameById = useMemo(() => {
    const map = {}
    hospitals.forEach((h) => {
      map[h.id] = h.name
    })
    return map
  }, [hospitals])

  useEffect(() => {
    fetchData()

    const interval = setInterval(() => {
      Promise.all([
        emergencyAPI.getEmergencyList(),
        emergencyAPI.getAvailableAmbulances(),
        hospitalAPI.getAll(),
      ]).then(([sos, amb, hosp]) => {
        setSosCalls(sos)
        setAmbulances(amb)
        setHospitals(hosp)
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Check for ambulance busy condition and show alert
  useEffect(() => {
    const pendingSOS = sosCalls.filter((c) => c.status === 'Pending' || c.status === 'On the Way')
    if (pendingSOS.length > 0 && ambulances.length === 0) {
      setBusyAlertMessage(`⚠️ Идэвхтэй машин байхгүй! ${pendingSOS.length} SOS хүлээгдэж буй. 103 дугаарт залга.`)
      setShowBusyAlert(true)
    } else {
      setShowBusyAlert(false)
    }
  }, [sosCalls, ambulances])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [hosp, sos, amb] = await Promise.all([
        hospitalAPI.getAll(),
        emergencyAPI.getEmergencyList(),
        emergencyAPI.getAvailableAmbulances(),
      ])
      setHospitals(hosp)
      setSosCalls(sos)
      setAmbulances(amb)
      if (hosp.length > 0) setSelectedHospital(hosp[0])
    } catch (error) {
      console.error('Өгөгдөл ачаалахад алдаа гарлаа:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Өгөгдлийг ачаалж байна...</div>
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <h2>Яаралтай тусламжийн удирдах самбар</h2>
        <p>Эмнэлэг, түргэн тусламж, SOS дуудлагын нэгдсэн хяналт</p>
        <div className="dashboard-actions">
          
        </div>
      </div>

      {showBusyAlert && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#991b1b', fontWeight: '600', fontSize: '14px' }}>
            {busyAlertMessage}
          </span>
          <button
            onClick={() => setShowBusyAlert(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0'
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="stats-grid">
        <StatCard icon="🏥" label="Нийт эмнэлэг" value={hospitals.length} variant="default" />
        <StatCard
          icon="🚨"
          label="Идэвхтэй яаралт"
          value={activeSosCount}
          variant={activeSosCount > 0 ? 'danger' : 'success'}
        />
        <StatCard
          icon="🚑"
          label="Сул бэлэн машин"
          value={ambulances.length}
          variant={ambulances.length === 0 ? 'danger' : 'success'}
        />
        <StatCard
          icon="📡"
          label={fleetStats.onCall > 0 ? 'Дуудлагад явсан' : 'Бүх машин сул'}
          value={
            fleetStats.onCall > 0
              ? fleetStats.onCall
              : fleetStats.available > 0
                ? 'Бэлэн'
                : 'Завгүй'
          }
          variant={fleetStats.onCall > 0 ? 'warning' : fleetStats.available > 0 ? 'success' : 'danger'}
          valueIsText={fleetStats.onCall === 0}
        />
      </div>

      <div className="map-container">
        <HospitalMap
          hospitals={hospitals}
          sosCalls={sortedSosCalls}
          ambulances={ambulances}
          selectedHospital={selectedHospital}
          selectedSOS={selectedSOS}
        />
      </div>

      <div className="section-panel">
        <div className="section-panel-header">
          <div>
            <h3 className="section-panel-title">🏥 Эмнэлгүүд</h3>
            <p className="section-panel-subtitle">
              Картаар сонгоход газрын зураг төвлөрнө
            </p>
          </div>
          <span className="section-badge">{hospitals.length} байгууллага</span>
        </div>

        <div>
          <div className="featured-row">
            {hospitals.slice(0, 3).map((hospital) => {
              const units = hospital.available_units || 0
              const isSelected = selectedHospital?.id === hospital.id
              return (
                <div
                  key={`featured-${hospital.id}`}
                  className={`entity-card entity-card--clickable entity-card--hospital featured-card ${
                    isSelected ? 'entity-card--selected' : ''
                  }`}
                  onClick={() => setSelectedHospital(hospital)}
                >
                  <div className="entity-card-head">
                    <div className="entity-avatar entity-avatar--hospital">🏥</div>
                    <div className="entity-title-wrap">
                      <h4 className="entity-title">{hospital.name}</h4>
                      <p className="entity-subtitle">ID #{hospital.id}</p>
                    </div>
                  </div>
                  <div className="entity-meta">
                    <div className="entity-meta-row">
                      <span className="entity-meta-icon">📍</span>
                      <span>{hospital.address}</span>
                    </div>
                  </div>
                  <div className="entity-footer">
                    {units > 0 ? (
                      <span className="status-pill status-pill--available">
                        ✓ {units} сул машин
                      </span>
                    ) : (
                      <span className="status-pill status-pill--empty">⚠ Сул машин байхгүй</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {hospitals.length > 3 && (
            <div className="entity-scroll-wrap">
              <p className="entity-scroll-label">Бусад эмнэлгүүд — доош гүйлгэнэ үү</p>
              <div className="entity-grid entity-grid--scroll">
            {hospitals.slice(3).map((hospital) => {
            const units = hospital.available_units || 0
            const isSelected = selectedHospital?.id === hospital.id
            return (
              <div
                key={hospital.id}
                className={`entity-card entity-card--clickable entity-card--hospital ${
                  isSelected ? 'entity-card--selected' : ''
                }`}
                onClick={() => setSelectedHospital(hospital)}
              >
                <div className="entity-card-head">
                  <div className="entity-avatar entity-avatar--hospital">🏥</div>
                  <div className="entity-title-wrap">
                    <h4 className="entity-title">{hospital.name}</h4>
                    <p className="entity-subtitle">ID #{hospital.id}</p>
                  </div>
                </div>
                <div className="entity-meta">
                  <div className="entity-meta-row">
                    <span className="entity-meta-icon">📍</span>
                    <span>{hospital.address}</span>
                  </div>
                  <div className="entity-meta-row">
                    <span className="entity-meta-icon">📞</span>
                    <a href={`tel:${hospital.phone}`} className="hospital-phone">
                      {hospital.phone}
                    </a>
                  </div>
                </div>
                <div className="entity-footer">
                  {units > 0 ? (
                    <span className="status-pill status-pill--available">
                      ✓ {units} сул машин
                    </span>
                  ) : (
                    <span className="status-pill status-pill--empty">⚠ Сул машин байхгүй</span>
                  )}
                  {isSelected && (
                    <span className="section-badge" style={{ padding: '4px 10px', fontSize: 11 }}>
                      Сонгогдсон
                    </span>
                  )}
                </div>
              </div>
            )
          })}
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="section-panel">
        <div className="section-panel-header">
          <div>
            <h3 className="section-panel-title">🚑 Сул түргэн тусламж</h3>
            <p className="section-panel-subtitle">
              Дуудлага хүлээн авахад бэлэн автомашинууд
            </p>
          </div>
          <span
            className={`section-badge ${
              ambulances.length === 0 ? 'section-badge--red' : 'section-badge--green'
            }`}
          >
            {ambulances.length} сул
          </span>
        </div>

        {ambulances.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚑</div>
            <p className="empty-state-title">Одоогоор сул машин байхгүй</p>
            <p className="empty-state-text">
              Бүх түргэн тусламж яаралтын дуудлагад гарсан байна. Шинэ SOS ирэхэд хамгийн
              ойр эмнэлгээс автоматаар хуваарилагдана.
            </p>
          </div>
        ) : (
          <div>
            <div className="featured-row">
              {ambulances.slice(0, 3).map((ambulance) => (
                <div key={`featured-amb-${ambulance.id}`} className="entity-card entity-card--ambulance featured-card">
                  <div className="entity-card-head">
                    <div className="entity-avatar entity-avatar--ambulance">🚑</div>
                    <div className="entity-title-wrap">
                      <h4 className="entity-title">{ambulance.driver_name || 'Жолооч'}</h4>
                      <p className="entity-subtitle">{hospitalNameById[ambulance.hospital_id] || 'Эмнэлэг'}</p>
                    </div>
                  </div>
                  <div className="entity-meta">
                    <div className="entity-meta-row">
                      <span className="entity-meta-icon">📍</span>
                      <span>{Number(ambulance.latitude).toFixed(5)},{' '}{Number(ambulance.longitude).toFixed(5)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {ambulances.length > 3 && (
              <div className="entity-scroll-wrap">
                <p className="entity-scroll-label">Бусад машинууд — доош гүйлгэнэ үү</p>
                <div className="entity-grid entity-grid--scroll">
              {ambulances.slice(3).map((ambulance) => (
                <div key={ambulance.id} className="entity-card entity-card--ambulance">
                  <div className="entity-card-head">
                    <div className="entity-avatar entity-avatar--ambulance">🚑</div>
                    <div className="entity-title-wrap">
                      <h4 className="entity-title">{ambulance.driver_name || 'Жолооч'}</h4>
                      <p className="entity-subtitle">{hospitalNameById[ambulance.hospital_id] || 'Эмнэлэг'}</p>
                    </div>
                  </div>
                  <div className="entity-meta">
                    <div className="entity-meta-row">
                      <span className="entity-meta-icon">📍</span>
                      <span>{Number(ambulance.latitude).toFixed(5)},{' '}{Number(ambulance.longitude).toFixed(5)}</span>
                    </div>
                  </div>
                  <div className="entity-footer">
                    <span className="status-pill status-pill--available">● Сул — бэлэн</span>
                    <span className="plate-badge">{ambulance.plate_number || `№${ambulance.id}`}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
            )}
          </div>
        )}
      </div>

      <div className="section-panel" ref={sosSectionRef}>
        <div className="section-panel-header">
          <div>
            <h3 className="section-panel-title" style={{ color: '#dc2626' }}>
              🚨 SOS дуудлагууд
            </h3>
            <p className="section-panel-subtitle">Бүртгэлийн түүх — шинэ нь дээр</p>
          </div>
          <span className={`section-badge ${activeSosCount > 0 ? 'section-badge--red' : ''}`}>
            {activeSosCount} идэвхтэй · {sosCalls.length} нийт
          </span>
        </div>

        {sortedSosCalls.length === 0 ? (
          <div className="empty-state" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)', borderColor: '#e2e8f0' }}>
            <div className="empty-state-icon">✓</div>
            <p className="empty-state-title" style={{ color: '#475569' }}>
              SOS дуудлага бүртгэгдээгүй
            </p>
            <p className="empty-state-text">Мобайл аппаас илгээсэн дуудлага энд харагдана.</p>
          </div>
        ) : (
          <div className="entity-grid">
            {sortedSosCalls.map((sos) => {
              const isActive = sos.status === 'Pending' || sos.status === 'On the Way'
              const statusLabel =
                sos.status === 'Pending'
                  ? 'Хүлээгдэж буй'
                  : sos.status === 'On the Way'
                    ? 'Явах замдаа'
                    : 'Дөчилсөн'
              const pillClass = isActive
                ? sos.status === 'Pending'
                  ? 'status-pill--empty'
                  : 'status-pill--busy'
                : 'status-pill--available'
              const categoryLabel = getCallCategory(sos)
              const categoryPillClass =
                categoryLabel === 'Хүнд' ? 'status-pill--busy' : 'status-pill--available'

              return (
                <div
                  key={sos.id}
                  className="entity-card"
                  onClick={() => { if (onOpenSOS) onOpenSOS(sos) }}
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: isActive ? '#ef4444' : '#22c55e',
                    cursor: 'pointer'
                  }}
                >
                  <div className="entity-card-head">
                    <div
                      className="entity-avatar"
                      style={{ background: isActive ? '#fee2e2' : '#dcfce7' }}
                    >
                      🚨
                    </div>
                    <div className="entity-title-wrap">
                      <h4 className="entity-title">SOS #{sos.id}</h4>
                      <p className="entity-subtitle">
                        {(() => {
                          const typeEmojis = {
                            'Түлэгдэлт': '💫',
                            'Осол': '🚗',
                            'Зүрхний шигдээс': '❤️',
                            'Гал түймрийн эрсдэл': '🔥'
                          };
                          const emoji = typeEmojis[sos.type] || '🚨';
                          return `${emoji} ${sos.type || 'Яаралт'}`;
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="entity-meta">
                    <div className="entity-meta-row">
                      <span className="entity-meta-icon">⏰</span>
                      <span>{new Date(sos.created_at).toLocaleString('mn-MN')}</span>
                    </div>
                    <div className="entity-meta-row">
                      <span className="entity-meta-icon">📍</span>
                      <span>
                        {Number(sos.latitude).toFixed(5)}, {Number(sos.longitude).toFixed(5)}
                      </span>
                    </div>
                  </div>
                  <div className="entity-footer">
                    <span className={`status-pill ${pillClass}`}>{statusLabel}</span>
                    <span className={`status-pill ${categoryPillClass}`}>
                      {categoryLabel}
                    </span>
                    {(() => {
                      const triage = sos.triage || sos.triage_level || sos.triageLevel;
                      if (!triage) return null;
                      const label = triage === 'heavy' ? 'Хүнд' : triage === 'medium' ? 'Дунд' : 'Хөнгөн';
                      return <span className={`triage-pill triage-pill--${triage}`}>{label}</span>;
                    })()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
    
  )
}
