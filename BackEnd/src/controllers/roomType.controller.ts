import type { Context } from 'hono'
import {
  getAllRoomTypes,
  createRoomType,
} from '../services/roomType.service'

export const getRoomTypesController = async (c: Context) => {
  try {
    const roomTypes = await getAllRoomTypes()

    return c.json({
      pesan: 'Berhasil mengambil kategori kamar',
      data: roomTypes,
    })
  } catch (error) {
    console.error(error)

    return c.json({
      pesan: 'Gagal mengambil kategori kamar',
    }, 500)
  }
}

export const createRoomTypeController = async (c: Context) => {
  try {
    const body = await c.req.json()

    const { name, description, basePrice } =
      body as Record<string, unknown>

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof basePrice !== 'number' ||
      !Number.isFinite(basePrice) ||
      basePrice < 0
    ) {
      return c.json({
        pesan: 'Nama kategori dan harga dasar wajib diisi dengan benar',
      }, 400)
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== 'string'
    ) {
      return c.json({
        pesan: 'Deskripsi harus berupa teks',
      }, 400)
    }

    const roomType = await createRoomType({
      name: name.trim(),
      description: description as string | undefined,
      basePrice,
    })

    return c.json({
      pesan: 'Berhasil menambahkan kategori kamar',
      data: roomType,
    }, 201)
  } catch (error) {
    console.error(error)

    return c.json({
      pesan: 'Gagal menambahkan kategori kamar',
    }, 500)
  }
}