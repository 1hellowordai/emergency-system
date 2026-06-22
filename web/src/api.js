import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const hospitalAPI = {
  async getAll() {
    try {
      const res = await api.get('/hospitals')
      return res.data
    } catch (error) {
      console.error('Error fetching hospitals:', error)
      return []
    }
  },

  async getById(id) {
    try {
      const res = await api.get(`/hospitals/${id}`)
      return res.data
    } catch (error) {
      console.error('Error fetching hospital:', error)
      return null
    }
  },
}

export const emergencyAPI = {
  async getAll() {
    try {
      const res = await api.get('/sos')
      return res.data
    } catch (error) {
      console.error('Error fetching SOS calls:', error)
      return []
    }
  },

  /** Дуудлагууд (хуваарилалттай) — вэб самбарт эрэмбэлэхэд */
  async getEmergencyList() {
    try {
      const res = await api.get('/api/emergency')
      return res.data || []
    } catch (error) {
      console.error('Error fetching emergency list:', error)
      return []
    }
  },

  async getById(id) {
    try {
      const res = await api.get(`/sos/${id}`)
      return res.data
    } catch (error) {
      console.error('Error fetching SOS:', error)
      return null
    }
  },

  async getAvailableAmbulances() {
    try {
      const res = await api.get('/api/ambulances/available')
      return res.data
    } catch (error) {
      console.error('Error fetching ambulances:', error)
      return []
    }
  },

  async createEmergency(data) {
    try {
      const res = await api.post('/api/emergency', data)
      return res.data
    } catch (error) {
      console.error('Error creating emergency:', error)
      throw error
    }
  },

  async clearAllEmergencies() {
    try {
      const res = await api.delete('/api/emergency/clear-all')
      return res.data
    } catch (error) {
      console.error('Error clearing emergencies:', error)
      throw error
    }
  },
}

export const ambulanceAPI = {
  async getAll() {
    try {
      const res = await api.get('/ambulances')
      return res.data
    } catch (error) {
      console.error('Error fetching ambulances:', error)
      return []
    }
  },
}

export default api
