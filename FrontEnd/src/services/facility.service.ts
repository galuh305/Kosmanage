import API_URL from "../config/api";

export type Facility = {
  id: number
  name: string
}

type FacilityResponse = {
  pesan: string
  data?: Facility[]
}

export const getFacilities = async (): Promise<Facility[]> => {
  const response = await fetch(`${API_URL}/facilities`)

  const result = await response.json() as FacilityResponse

  if (!response.ok || !result.data) {
    throw new Error(result.pesan || 'Gagal mengambil daftar fasilitas')
  }

  return result.data
}
