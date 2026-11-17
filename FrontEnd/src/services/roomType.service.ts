import API_URL from "../config/api";

export type RoomType = {
  id: number
  name: string
  description: string | null
  basePrice: number | string
}

type RoomTypeResponse = {
  pesan: string
  data?: RoomType[]
}

export const getRoomTypes = async (): Promise<RoomType[]> => {
  const response = await fetch(`${API_URL}/room-types`)
  const result = await response.json() as RoomTypeResponse

  if (!response.ok || !result.data) {
    throw new Error(result.pesan || 'Gagal mengambil tipe kamar')
  }

  return result.data
}
