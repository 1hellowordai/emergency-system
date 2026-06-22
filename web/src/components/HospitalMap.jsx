import { useEffect, useRef } from 'react'
import L from 'leaflet'

export default function HospitalMap({ hospitals, sosCalls = [], ambulances = [], selectedHospital, selectedSOS }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef({})

  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([47.92, 106.92], 11)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map.current)
    }

    // Clear existing markers
    Object.values(markers.current).forEach((marker) => marker.remove())
    markers.current = {}

    const visibleHospitals = selectedHospital
      ? hospitals.filter((hospital) => hospital.id === selectedHospital.id)
      : hospitals

    const visibleAmbulances = selectedHospital
      ? ambulances.filter(
          (ambulance) =>
            ambulance.hospital_id === selectedHospital.id ||
            ambulance.Hospital?.id === selectedHospital.id
        )
      : ambulances

    const sosMatchesHospital = (sos) => {
      if (!selectedHospital) return true
      if (sos.nearest_hospital_id === selectedHospital.id) return true
      if (sos.hospital_id === selectedHospital.id) return true
      if (sos.hospital?.id === selectedHospital.id) return true
      return sos.CallAssignments?.some(
        (assignment) =>
          assignment.Ambulance?.hospital_id === selectedHospital.id ||
          assignment.Ambulance?.Hospital?.id === selectedHospital.id
      )
    }

    const visibleSosCalls = selectedHospital ? sosCalls.filter(sosMatchesHospital) : sosCalls

    // Hospital icon (blue)
    const hospitalIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNmZmYiIHJ4PSI0Ii8+PGcgZmlsbD0iIzFmNTdmZiI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyYzAgNC4zNiAyLjkzIDguMDcgNyA5LjQ3VjIyaDAuMDFjMCAuNTUuNDUgMSAxIDFzMS0uNDUgMS0xdjEuNDNoMGMwIC41NS40NSAxIDEgMXMxLS40NSAxLTF2LTEuNDZjNC4wNy0xLjQgNy01LjExIDctOS40N0MyMiA2LjQ4IDE3LjUyIDIgMTIgMnptMCA0YzIuMjEgMCA0IDEuNzkgNCA0cy0xLjc5IDQtNCA0LTQtMS43OS00LTQgMS43OS00IDQtNHoiLz48L2c+PC9zdmc+',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    })

    // Ambulance icon (green for available, orange for on call)
    const ambulanceIcon = (status) => L.icon({
      iconUrl: status === 'Available'
        ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNmZmYiIHJ4PSI0Ii8+PGcgZmlsbD0iIzRjYWY1MCI+PHBhdGggZD0iTTIwIDExSDd2LTJINWMtMS4xIDAtMi0uOS0yLTJWOGMwLTEuMS45LTItMi0ySDJ2NWMwIDEuMS45IDIgMiAyaDE3YzEuMSAwIDIgLjkgMiAydjJoLTJ6bS0xIDJINWMtMS4xIDAtMi0uOS0yLTJWOGMwLTEuMS45LTItMi0ySDJ2NWMwIDEuMS45IDIgMiAyaDE3YzEuMSAwIDIgLjkgMiAydjJoLTJ6Ii8+PC9nPjwvc3ZnPg=='
        : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNmZmYiIHJ4PSI0Ii8+PGcgZmlsbD0iI2ZmOTgwMCI+PHBhdGggZD0iTTIwIDExSDd2LTJINWMtMS4xIDAtMi0uOS0yLTJWOGMwLTEuMS45LTItMi0ySDJ2NWMwIDEuMS45IDIgMiAyaDE3YzEuMSAwIDIgLjkgMiAydjJoLTJ6bS0xIDJINWMtMS4xIDAtMi0uOS0yLTJWOGMwLTEuMS45LTItMi0ySDJ2NWMwIDEuMS45IDIgMiAyaDE3YzEuMSAwIDIgLjkgMiAydjJoLTJ6Ii8+PC9nPjwvc3ZnPg==',
      iconSize: [35, 35],
      iconAnchor: [17, 35],
      popupAnchor: [0, -35],
    })

    // SOS icon (red, pulsing)
    const sosIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0IiBmaWxsPSIjZWExMDAwIi8+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZWExMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjIsMiIgZD0iTTEyIDRDNy41OCA0IDQgNy41OCA0IDEyYzAgNC40MiAzLjU4IDggOCA4czgtMy41OCA4LTgtMy41OC04LTgtOHptMCAxNGMtMy4zMSAwLTYtMi42OS02LTZzMi42OS02IDYtNiA2IDIuNjkgNiA2LTIuNjkgNi02IDZ6Ii8+PC9zdmc+',
      iconSize: [45, 45],
      iconAnchor: [22, 45],
      popupAnchor: [0, -45],
    })

    // Add hospital markers
    visibleHospitals.forEach((hospital) => {
      const units = hospital.available_units || 0
      const unitsLabel =
        units > 0
          ? `<span style="color: #4caf50; font-weight: 600;">🚑 Сул: ${units}</span>`
          : `<span style="color: #ff1744; font-weight: 600;">⚠ Сул машин байхгүй</span>`
      // Build recent SOS list for this hospital
      const recent = sosCalls.filter((s) => {
        if (s.nearest_hospital_id === hospital.id) return true
        if (s.hospital_id === hospital.id) return true
        if (s.hospital && s.hospital.id === hospital.id) return true
        if (
          s.CallAssignments &&
          s.CallAssignments.some((a) =>
            a.Ambulance &&
            (a.Ambulance.hospital_id === hospital.id || (a.Ambulance.Hospital && a.Ambulance.Hospital.id === hospital.id))
          )
        )
          return true
        return false
      }).slice(0, 5)

      let recentHtml = ''
      if (recent.length > 0) {
        recentHtml = '<div style="margin-top:8px;font-size:12px;color:#374151;"><strong>Сүүлд ирсэн дуудлага:</strong><ul style="margin:6px 0 0 14px;padding:0;">'
        recent.forEach((r) => {
          recentHtml += '<li style="margin-bottom:6px;">#' + r.id + ' ' + new Date(r.created_at).toLocaleString('mn-MN') + ' - ' + (r.status || '') + '</li>'
        })
        recentHtml += '</ul></div>'
      }

      const marker = L.marker([hospital.latitude, hospital.longitude], { icon: hospitalIcon })
        .addTo(map.current)
        .bindPopup(
          `<div style="font-size: 14px; font-weight: 500;">
            <strong style="color: #1f57ff;">🏥 ${hospital.name}</strong><br/>
            <span style="color: #666;">📞 ${hospital.phone}</span><br/>
            ${unitsLabel}
            ${recentHtml}
          </div>`
        )

      if (selectedHospital?.id === hospital.id) {
        marker.openPopup()
        map.current.setView([hospital.latitude, hospital.longitude], 13)
      }

      markers.current[`hospital-${hospital.id}`] = marker
    })

    // Only auto-fit bounds when no hospital is pinned, to avoid repeated zoom jumps
    const autoFit = !selectedHospital

    // Add ambulance markers
    visibleAmbulances.forEach((ambulance) => {
      const statusColor = ambulance.status === 'Available' ? '#4caf50' : ambulance.status === 'On Call' ? '#ff9800' : '#f44336'
      const statusLabel = ambulance.status === 'Available' ? 'Сул' : ambulance.status === 'On Call' ? 'Дуудлагад явсан' : 'Боломжгүй'

      const marker = L.marker([ambulance.latitude, ambulance.longitude], { icon: ambulanceIcon(ambulance.status) })
        .addTo(map.current)
        .bindPopup(
          `<div style="font-size: 13px;">
            <strong style="color: ${statusColor};">🚑 Түргэн тусламж</strong><br/>
            <span style="color: #666;">Жолооч: ${ambulance.driver_name}</span><br/>
            <span style="color: ${statusColor}; font-weight: 600;">Статус: ${statusLabel}</span>
          </div>`
        )

      markers.current[`ambulance-${ambulance.id}`] = marker
    })

    // Add SOS call markers
    visibleSosCalls.forEach((sos) => {
      // Priority-based styling
      let markerColor, markerRadius, priorityLabel;
      switch (sos.priority) {
        case 'Critical':
          markerColor = '#dc2626'; // Red
          markerRadius = 15;
          priorityLabel = '❗ Критично';
          break;
        case 'High':
          markerColor = '#ea580c'; // Orange
          markerRadius = 13;
          priorityLabel = '‼️ Өндөр';
          break;
        case 'Medium':
          markerColor = '#ca8a04'; // Yellow
          markerRadius = 11;
          priorityLabel = '⚠️ Дунд';
          break;
        case 'Low':
          markerColor = '#16a34a'; // Green
          markerRadius = 9;
          priorityLabel = 'ℹ️ Нам';
          break;
        default:
          markerColor = '#ff1744';
          markerRadius = 10;
          priorityLabel = 'SOS';
      }

      const statusColor = sos.status === 'Pending' ? markerColor : sos.status === 'On the Way' ? '#ff9800' : '#4caf50'
      const statusLabel =
        sos.status === 'Pending' ? 'Хүлээгдэж буй' : sos.status === 'On the Way' ? 'Явах замдаа' : 'Дөчилсөн'

      const marker = L.circleMarker([sos.latitude, sos.longitude], {
        radius: markerRadius,
        fillColor: statusColor,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
        className: sos.status === 'Pending' ? 'pulsing-marker' : '',
      })
        .addTo(map.current)
        .bindPopup(
          `<div style="font-size: 13px;">
            <strong style="color: ${statusColor};">🚨 ${priorityLabel} - SOS Дуудлага</strong><br/>
            <span style="color: #666;">Статус: ${statusLabel}</span><br/>
            <span style="color: #666;">Төрөл: ${sos.type || 'SOS'}</span><br/>
            <span style="color: #999; font-size: 11px;">📍 ${sos.latitude.toFixed(6)}, ${sos.longitude.toFixed(6)}</span><br/>
            <span style="color: #999; font-size: 11px;">⏰ ${new Date(sos.created_at).toLocaleTimeString('mn-MN')}</span>
          </div>`
        )

      if (sos.status === 'Pending') {
        marker.openPopup()
      }

      markers.current[`sos-${sos.id}`] = marker
    })

    // If a specific SOS was selected from the dashboard, open its popup and center map
    if (selectedSOS && markers.current[`sos-${selectedSOS.id}`]) {
      const m = markers.current[`sos-${selectedSOS.id}`]
      m.openPopup()
      map.current.setView([selectedSOS.latitude, selectedSOS.longitude], 14)
    }

    // Fit map to show all markers
    const allMarkers = [
      ...visibleHospitals.map((h) => [h.latitude, h.longitude]),
      ...visibleAmbulances.map((a) => [a.latitude, a.longitude]),
      ...visibleSosCalls.map((s) => [s.latitude, s.longitude])
    ]

    if (allMarkers.length > 0 && autoFit) {
      const bounds = L.latLngBounds(allMarkers)
      map.current.fitBounds(bounds, { padding: [20, 20] })
    }

  }, [hospitals, sosCalls, ambulances, selectedHospital, selectedSOS])

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.8; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }
        .pulsing-marker {
          animation: pulse 1.5s infinite;
        }
      `}</style>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </>
  )
}
     

