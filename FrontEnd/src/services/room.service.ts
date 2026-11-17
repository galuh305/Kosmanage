
import API_URL from "../config/api";

export type Room = {
  id: number
  roomNumber: string
  name: string
  description: string | null
  price: number | string | null
  imageUrl: string | null
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE'
  roomTypeId: number
  roomType: {
    id: number
    name: string
    basePrice: number | string
  }
  facilities: {
    facility: {
      id: number
      name: string
    }
  }[]
}

type RoomResponse = {
  pesan: string
  data?: Room[]
}

export const getRooms = async (): Promise<Room[]> => {
  const response = await fetch(`${API_URL}/rooms`)
  const result = await response.json() as RoomResponse

  if (!response.ok || !result.data) {
    throw new Error(result.pesan || 'Gagal mengambil daftar kamar')
  }

  return result.data
}

export type CreateRoomInput = {
  roomNumber: string
  name: string
  description?: string
  price?: number
  roomTypeId: number
  facilityIds?: number[]
  image?: File | null
}

export const createRoom = async (
  data: CreateRoomInput
): Promise<Room> => {
  const token = localStorage.getItem('kosmanage_token')

  if (!token) {
    throw new Error('Token tidak ditemukan. Silakan login kembali.')
  }

  const formData = new FormData()

  formData.append('roomNumber', data.roomNumber)
  formData.append('name', data.name)
  formData.append('roomTypeId', String(data.roomTypeId))

  if (data.description) {
    formData.append('description', data.description)
  }

  if (data.price !== undefined) {
    formData.append('price', String(data.price))
  }

  if (data.facilityIds) {
    formData.append('facilityIds', JSON.stringify(data.facilityIds))
  }

  if (data.image) {
    formData.append('image', data.image)
  }

  const response = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const result = await response.json() as {
    pesan: string
    data?: Room
  }

  if (!response.ok || !result.data) {
    throw new Error(result.pesan || 'Gagal menambahkan kamar')
  }

  return result.data
}

export type UpdateRoomInput = {
  roomNumber?: string
  name?: string
  description?: string
  price?: number
  roomTypeId?: number
  image?: File | null

}

export const updateRoom = async (
  id: number,
  data: UpdateRoomInput
): Promise<Room> => {
  const token = localStorage.getItem('kosmanage_token')

  if (!token) {
    throw new Error('Token tidak ditemukan. Silakan login kembali.')
  }

  const formData = new FormData()

  if (data.roomNumber !== undefined) {
    formData.append('roomNumber', data.roomNumber)
  }

  if (data.name !== undefined) {
    formData.append('name', data.name)
  }

  if (data.description !== undefined) {
    formData.append('description', data.description)
  }

  if (data.price !== undefined) {
    formData.append('price', String(data.price))
  }

  if (data.roomTypeId !== undefined) {
    formData.append('roomTypeId', String(data.roomTypeId))
  }

  if (data.image) {
    formData.append('image', data.image)
  }

  const response = await fetch(`${API_URL}/rooms/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const result = await response.json() as {
    pesan: string
    data?: Room
  }

  if (!response.ok || !result.data) {
    throw new Error(result.pesan || 'Gagal memperbarui kamar')
  }

  return result.data
}

export const getRoomById = async (id: number): Promise<Room> => {
  const response = await fetch(`${API_URL}/rooms/${id}`)

  const result = await response.json() as {
    pesan: string
    data?: Room
  }

  if (!response.ok || !result.data) {
    throw new Error(result.pesan || 'Gagal mengambil detail kamar')
  }

  return result.data
}

export const updateRoomFacilities = async (
  id: number,
  facilityIds: number[]
): Promise<Room> => {
  const token = localStorage.getItem('kosmanage_token')

  if (!token) {
    throw new Error('Token tidak ditemukan. Silakan login kembali.')
  }

  const response = await fetch(`${API_URL}/rooms/${id}/facilities`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ facilityIds }),
  })

  const result = await response.json() as {
    pesan: string
    data?: Room
  }

  if (!response.ok || !result.data) {
    throw new Error(result.pesan || 'Gagal memperbarui fasilitas kamar')
  }

  return result.data
}
