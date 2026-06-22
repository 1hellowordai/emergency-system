import { useEffect, useState } from 'react'
import { hospitalAPI, emergencyAPI } from '../api'
import HospitalMap from '../components/HospitalMap'

export default function SOSHistory({ sos: initialSos, onBack, onSelectHospital }) {
  const [hospitals, setHospitals] = useState([])
  const [sosCalls, setSosCalls] = useState([])
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [hosp, sos] = await Promise.all([hospitalAPI.getAll(), emergencyAPI.getEmergencyList()])
      setHospitals(hosp)
      setSosCalls(sos)
      if (initialSos) {
        // center on initial sos
        setSelectedHospital(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const sosForHospital = (hospital) => {
    return sosCalls.filter((s) =>
      s.nearest_hospital_id === hospital.id ||
      s.hospital_id === hospital.id ||
      (s.hospital && s.hospital.id === hospital.id) ||
      (s.CallAssignments && s.CallAssignments.some(a => a.Ambulance && (a.Ambulance.hospital_id === hospital.id || (a.Ambulance.Hospital && a.Ambulance.Hospital.id === hospital.id))))
    )
  }

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ width: 320 }}>
        <h3 style={{ marginTop: 0 }}>Эмнэлгүүд</h3>
        <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
          {hospitals.map((h) => (
            <div key={h.id} style={{ padding: 12, border: '1px solid #e6eef7', borderRadius: 8, marginBottom: 8, cursor: 'pointer', background: selectedHospital?.id === h.id ? '#f0f7ff' : '#fff' }} onClick={() => { setSelectedHospital(h); onSelectHospital && onSelectHospital(h.id) }}>
              <strong>{h.name}</strong>
              <div style={{ fontSize: 12, color: '#64748b' }}>{h.address}</div>
              <div style={{ marginTop: 6, fontSize: 12 }}>{`Ойрхон дуудлагууд: ${sosForHospital(h).length}`}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ height: 360, marginBottom: 12 }}>
          <HospitalMap hospitals={hospitals} sosCalls={sosCalls} ambulances={[]} selectedHospital={selectedHospital} selectedSOS={initialSos} />
        </div>

        <div>
          <h3 style={{ marginTop: 0 }}>SOS Дуудлагын Түүх {selectedHospital ? `- ${selectedHospital.name}` : ''}</h3>
          <div style={{ maxHeight: '40vh', overflow: 'auto' }}>
            { (selectedHospital ? sosForHospital(selectedHospital) : sosCalls).map((s) => (
              <div key={s.id} style={{ padding: 12, border: '1px solid #e6eef7', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>SOS #{s.id}</strong>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{s.type || 'Яаралт'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12 }}>{new Date(s.created_at).toLocaleString('mn-MN')}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.status}</div>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 13 }}>{`📍 ${Number(s.latitude).toFixed(6)}, ${Number(s.longitude).toFixed(6)}`}</div>
                <div style={{ marginTop: 8, fontSize: 13, color: '#475569' }}>
                  {s.patient_name ? `🧑‍⚕️ ${s.patient_name} (${s.patient_phone || 'утас мэдэгдээгүй'})` : '🧾 Өвчтөний мэдээлэл байхгүй'}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: '#475569' }}>
                  {s.emergency_service_number ? `📞 Үйлчилгээ: ${s.emergency_service_number}` : `📌 Ойр эмнэлэг: ${s.NearestHospital?.name || 'тодорхойгүй'}`}
                </div>
                {s.CallAssignments?.[0]?.Ambulance ? (
                  <div style={{ marginTop: 4, fontSize: 13, color: '#0f766e' }}>
                    🚑 Хуваарилагдсан: {s.CallAssignments[0].Ambulance.driver_name || `Машин #${s.CallAssignments[0].Ambulance.id}`} ({s.CallAssignments[0].Ambulance.Hospital?.name || 'эмнэлэгтэй'})
                  </div>
                ) : (
                  <div style={{ marginTop: 4, fontSize: 13, color: '#b45309' }}>
                    🕒 Хуваарилалт хийгдэж байна
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
