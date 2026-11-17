import API_URL from "../config/api";

export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export type Booking = {
  id: number
  userId: number | null
  roomId: number
  guestName: string
  guestEmail: string
  guestPhone: string
  startDate: string | null
  endDate: string | null
  message: string | null
  status: BookingStatus
  createdAt: string
  updatedAt: string

  user?: {
    id: number
    name: string
    email: string
    phone: string | null
    role: string
    mustChangePassword?: boolean
    activationExpiresAt?: string | null
  } | null

  room: {
    id: number
    roomNumber: string
    name: string
    description: string | null
    price: number | string | null
    status: string
    roomType: {
      id: number
      name: string
      basePrice: number | string
    }
  }
}

type BookingResponse = {
  pesan: string
  data?: Booking[]
}

export const getBookings = async (): Promise<Booking[]> => {
  const token = localStorage.getItem('kosmanage_token')

  if (!token) {
    throw new Error('Token tidak ditemukan. Silakan login kembali.')
  }

  const response = await fetch(`${API_URL}/bookings`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const result = (await response.json()) as BookingResponse

  if (!response.ok || !result.data) {
    throw new Error(
      result.pesan || 'Gagal mengambil data pemesanan'
    )
  }

  return result.data
}

export type UpdateBookingResult = {
  pesan: string
  booking: Booking
  activationToken: string | null
}

export const updateBookingStatus = async (
  id: number,
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED'
): Promise<UpdateBookingResult> => {
  const token = localStorage.getItem('kosmanage_token')

  if (!token) {
    throw new Error('Token tidak ditemukan. Silakan login kembali.')
  }

  const response = await fetch(
    `${API_URL}/bookings/${id}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  )

  const result = (await response.json()) as {
    pesan: string
    data?: Booking
    activationToken?: string | null
  }

  if (!response.ok || !result.data) {
    throw new Error(
      result.pesan || 'Gagal memperbarui status pemesanan'
    )
  }

  return {
    pesan: result.pesan,
    booking: result.data,
    activationToken: result.activationToken ?? null,
  }
}


export type CreateBookingInput = {
  roomId: number
  guestName: string
  guestEmail: string
  guestPhone: string
  startDate: string
  endDate?: string
  message?: string
}

export const createBooking = async (
  data: CreateBookingInput
): Promise<{ pesan: string; data: Booking }> => {
  const response = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok || !result.data) {
    throw new Error(
      result.pesan || 'Gagal mengajukan pemesanan'
    )
  }

  return result
}

export type ActivationTokenResult = {
  pesan: string
  activationToken: string
  expiresAt: string
}

export const regenerateActivationToken = async (
  id: number
): Promise<ActivationTokenResult> => {
  const token = localStorage.getItem('kosmanage_token')

  if (!token) {
    throw new Error('Token tidak ditemukan. Silakan login kembali.')
  }

  const response = await fetch(
    `${API_URL}/bookings/${id}/activation-token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const result = await response.json()

  if (!response.ok || !result.activationToken) {
    throw new Error(
      result.pesan || 'Gagal membuat token aktivasi'
    )
  }

  return result
}

export type CancelApprovedBookingResult = {
  pesan: string
  booking: Booking
  cancelledInvoices: number
  paidInvoices: number
}

export const cancelApprovedBooking = async (
  id: number
): Promise<CancelApprovedBookingResult> => {
  const token = localStorage.getItem('kosmanage_token')

  if (!token) {
    throw new Error('Token tidak ditemukan. Silakan login kembali.')
  }

  const response = await fetch(`${API_URL}/bookings/${id}/cancel`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const result = await response.json()

  if (!response.ok || !result.data) {
    throw new Error(
      result.pesan || 'Gagal membatalkan pemesanan'
    )
  }

  return {
    pesan: result.pesan,
    booking: result.data,
    cancelledInvoices: result.cancelledInvoices ?? 0,
    paidInvoices: result.paidInvoices ?? 0,
  }
}
