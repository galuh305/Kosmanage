import type { Context } from 'hono'

import {
  getAllFacilities,
  createFacility,
} from '../services/facility.service'

export const getFacilitiesController = async (c: Context) => {
  try {
    const facilities = await getAllFacilities()

    return c.json({
      pesan: 'Berhasil mengambil data fasilitas',
      data: facilities,
    })
  } catch (error) {
    console.error(error)

    return c.json({
      pesan: 'Gagal mengambil data fasilitas',
    }, 500)
  }
}

export const createFacilityController = async (c: Context) => {
  try {
    const body = await c.req.json()
    const { name } = body as Record<string, unknown>

    if (typeof name !== 'string' || !name.trim()) {
      return c.json({
        pesan: 'Nama fasilitas wajib diisi',
      }, 400)
    }

    const facility = await createFacility({
      name: name.trim(),
    })

    return c.json({
      pesan: 'Berhasil menambahkan fasilitas',
      data: facility,
    }, 201)
  } catch (error) {
    console.error(error)

    return c.json({
      pesan: 'Gagal menambahkan fasilitas',
    }, 500)
  }
}