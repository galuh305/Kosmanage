
import { getToken } from './auth.service'
import API_URL from '../config/api'

export type DashboardData = {
  rooms: {
    total: number
    available: number
    occupied: number
    reserved: number
    maintenance: number
  }
  bookings: {
    total: number
    pending: number
  }
  payments: {
    totalRevenue: number
    successfulTransactions: number
    pendingTransactions: number
    failedTransactions: number
  }
  monthlyRevenue: {
    month: string
    revenue: number
  }[]
}

type DashboardResponse = {
  pesan: string
  data?: DashboardData
}

export const getDashboard = async (): Promise<DashboardData> => {
  const token = getToken()

  if (!token) {
    throw new Error('Token tidak ditemukan. Silakan login kembali.')
  }

  const response = await fetch(`${API_URL}/dashboard`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const result = await response.json() as DashboardResponse

  if (!response.ok || !result.data) {
    throw new Error(result.pesan || 'Gagal mengambil data dashboard')
  }

  return result.data
}
