import type { Context } from 'hono'
import { uploadRoomImage } from '../lib/upload'
import { unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { 
    getAllRooms, 
    getRoomById, 
    createRoom, 
    updateRoom, 
    updateRoomStatus, 
    updateRoomFacilities,
 } from '../services/room.service'


export const getRoomsController = async (c: Context) => {
  try {
    const rooms = await getAllRooms()

    return c.json({
      pesan: 'Berhasil mengambil data kamar',
      data: rooms,
    })
  } catch (error) {
    console.error(error)

    return c.json(
      {
        pesan: 'Gagal mengambil data kamar',
      },
      500
    )
  }
}

export const getRoomDetailController = async (c: Context) => {
  try {
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({
        pesan: 'ID kamar tidak valid',
      }, 400)
    }

    const room = await getRoomById(id)

    if (!room) {
      return c.json({
        pesan: 'Kamar tidak ditemukan',
      }, 404)
    }

    return c.json({
      pesan: 'Berhasil mengambil detail kamar',
      data: room,
    })
  } catch (error) {
    console.error(error)

    return c.json({
      pesan: 'Gagal mengambil detail kamar',
    }, 500)
  }
}



export const createRoomController = async (c: Context) => {
  let uploadedImageUrl: string | undefined

  try {
    const body = await c.req.parseBody()

    const roomNumber = body['roomNumber']
    const name = body['name']
    const description = body['description']
    const price = body['price']
    const roomTypeId = body['roomTypeId']
    const facilityIds = body['facilityIds']
    const image = body['image']

    // Validasi data wajib
    if (
      typeof roomNumber !== 'string' ||
      !roomNumber.trim() ||
      typeof name !== 'string' ||
      !name.trim() ||
      typeof roomTypeId !== 'string' ||
      !Number.isInteger(Number(roomTypeId)) ||
      Number(roomTypeId) <= 0
    ) {
      return c.json({
        pesan: 'Nomor kamar, nama kamar, dan tipe kamar wajib diisi dengan benar',
      }, 400)
    }

    // Validasi deskripsi
    if (
      description !== undefined &&
      typeof description !== 'string'
    ) {
      return c.json({
        pesan: 'Deskripsi harus berupa teks',
      }, 400)
    }

    // Validasi harga
    const parsedPrice =
      typeof price === 'string' && price.trim() !== ''
        ? Number(price)
        : undefined

    if (
      parsedPrice !== undefined &&
      (!Number.isFinite(parsedPrice) || parsedPrice < 0)
    ) {
      return c.json({
        pesan: 'Harga kamar tidak valid',
      }, 400)
    }

    // Validasi fasilitas
    let parsedFacilityIds: number[] = []

    if (facilityIds !== undefined) {
      if (typeof facilityIds !== 'string') {
        return c.json({
          pesan: 'Daftar fasilitas tidak valid',
        }, 400)
      }

      try {
        const parsed = JSON.parse(facilityIds)

        if (
          !Array.isArray(parsed) ||
          !parsed.every(
            (id) => Number.isInteger(id) && id > 0
          )
        ) {
          return c.json({
            pesan: 'Daftar fasilitas tidak valid',
          }, 400)
        }

        parsedFacilityIds = [...new Set(parsed as number[])]
      } catch {
        return c.json({
          pesan: 'Format daftar fasilitas tidak valid',
        }, 400)
      }
    }

    // Upload foto jika tersedia
    if (image !== undefined && image !== '') {
      if (!(image instanceof File)) {
        return c.json({
          pesan: 'File foto tidak valid',
        }, 400)
      }

      uploadedImageUrl = await uploadRoomImage(image)
    }

    // Simpan data kamar
    const room = await createRoom({
      roomNumber: roomNumber.trim(),
      name: name.trim(),
      description: description as string | undefined,
      price: parsedPrice,
      roomTypeId: Number(roomTypeId),
      facilityIds: parsedFacilityIds,
      imageUrl: uploadedImageUrl,
    })

    return c.json({
      pesan: 'Berhasil menambahkan kamar',
      data: room,
    }, 201)

  } catch (error) {
    console.error(error)

    // Hapus foto jika upload berhasil tetapi penyimpanan database gagal
    if (uploadedImageUrl) {
      try {
        const { unlink } = await import('node:fs/promises')
        const { resolve } = await import('node:path')

        await unlink(
          resolve(process.cwd(), uploadedImageUrl.replace(/^\//, ''))
        )
      } catch (cleanupError) {
        console.error('Gagal menghapus foto sementara:', cleanupError)
      }
    }

    const message =
      error instanceof Error ? error.message : ''

    if (
      message.includes('Format foto') ||
      message.includes('Ukuran foto') ||
      message.includes('File foto')
    ) {
      return c.json({ pesan: message }, 400)
    }

    if (message.includes('Unique constraint')) {
      return c.json({
        pesan: 'Nomor kamar sudah digunakan',
      }, 409)
    }

    return c.json({
      pesan: 'Gagal menambahkan kamar. Periksa kembali data yang dikirim.',
    }, 500)
  }
}



export const updateRoomController = async (c: Context) => {
  let uploadedImageUrl: string | undefined

  try {
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ pesan: 'ID kamar tidak valid' }, 400)
    }

    const existingRoom = await getRoomById(id)

    if (!existingRoom) {
      return c.json({ pesan: 'Kamar tidak ditemukan' }, 404)
    }

    const body = await c.req.parseBody()

    const roomNumber = body['roomNumber']
    const name = body['name']
    const description = body['description']
    const price = body['price']
    const roomTypeId = body['roomTypeId']
    const image = body['image']

    // Validasi nomor kamar
    if (
      roomNumber !== undefined &&
      (typeof roomNumber !== 'string' || !roomNumber.trim())
    ) {
      return c.json({ pesan: 'Nomor kamar tidak valid' }, 400)
    }

    // Validasi nama kamar
    if (
      name !== undefined &&
      (typeof name !== 'string' || !name.trim())
    ) {
      return c.json({ pesan: 'Nama kamar tidak valid' }, 400)
    }

    // Validasi deskripsi
    if (
      description !== undefined &&
      typeof description !== 'string'
    ) {
      return c.json({ pesan: 'Deskripsi harus berupa teks' }, 400)
    }

    // Validasi harga
    let parsedPrice: number | undefined

    if (price !== undefined) {
      if (typeof price !== 'string' || price.trim() === '') {
        return c.json({ pesan: 'Harga kamar tidak valid' }, 400)
      }

      parsedPrice = Number(price)

      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return c.json({ pesan: 'Harga kamar tidak valid' }, 400)
      }
    }

    // Validasi tipe kamar
    let parsedRoomTypeId: number | undefined

    if (roomTypeId !== undefined) {
      if (
        typeof roomTypeId !== 'string' ||
        !Number.isInteger(Number(roomTypeId)) ||
        Number(roomTypeId) <= 0
      ) {
        return c.json({ pesan: 'Kategori kamar tidak valid' }, 400)
      }

      parsedRoomTypeId = Number(roomTypeId)
    }

    // Upload foto baru jika dipilih
    if (image !== undefined && image !== '') {
      if (!(image instanceof File)) {
        return c.json({ pesan: 'File foto tidak valid' }, 400)
      }

      uploadedImageUrl = await uploadRoomImage(image)
    }

    // Perbarui data kamar
    const updatedRoom = await updateRoom(id, {
      roomNumber:
        typeof roomNumber === 'string'
          ? roomNumber.trim()
          : undefined,
      name:
        typeof name === 'string'
          ? name.trim()
          : undefined,
      description: description as string | undefined,
      price: parsedPrice,
      roomTypeId: parsedRoomTypeId,
      imageUrl: uploadedImageUrl,
    })

    // Hapus foto lama setelah database berhasil diperbarui
    if (uploadedImageUrl && existingRoom.imageUrl) {
      try {
        await unlink(
          resolve(
            process.cwd(),
            existingRoom.imageUrl.replace(/^\//, '')
          )
        )
      } catch (cleanupError) {
        console.error('Gagal menghapus foto lama:', cleanupError)
      }
    }

    return c.json({
      pesan: 'Berhasil memperbarui data kamar',
      data: updatedRoom,
    })
  } catch (error) {
    console.error(error)

    // Hapus foto baru jika upload berhasil tetapi update database gagal
    if (uploadedImageUrl) {
      try {
        await unlink(
          resolve(
            process.cwd(),
            uploadedImageUrl.replace(/^\//, '')
          )
        )
      } catch (cleanupError) {
        console.error('Gagal menghapus foto baru:', cleanupError)
      }
    }

    const message =
      error instanceof Error ? error.message : ''

    if (
      message.includes('Format foto') ||
      message.includes('Ukuran foto') ||
      message.includes('File foto')
    ) {
      return c.json({ pesan: message }, 400)
    }

    if (message.includes('Unique constraint')) {
      return c.json({
        pesan: 'Nomor kamar sudah digunakan',
      }, 409)
    }

    return c.json({
      pesan: 'Gagal memperbarui data kamar',
    }, 500)
  }
}

export const updateRoomStatusController = async (c: Context) => {
  try {
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ pesan: 'ID kamar tidak valid' }, 400)
    }

    const existingRoom = await getRoomById(id)

    if (!existingRoom) {
      return c.json({ pesan: 'Kamar tidak ditemukan' }, 404)
    }

    const body = await c.req.json()
    const { status } = body as Record<string, unknown>

    const allowedStatuses = [
      'AVAILABLE',
      'OCCUPIED',
      'MAINTENANCE',
    ]

    if (
      typeof status !== 'string' ||
      !allowedStatuses.includes(status)
    ) {
      return c.json({
        pesan: 'Status harus AVAILABLE, OCCUPIED, atau MAINTENANCE',
      }, 400)
    }

    const updatedRoom = await updateRoomStatus(id, {
      status: status as 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE',
    })

    return c.json({
      pesan: 'Berhasil memperbarui status kamar',
      data: updatedRoom,
    })
  } catch (error) {
    console.error(error)
    return c.json({
      pesan: 'Gagal memperbarui status kamar',
    }, 500)
  }
}

export const updateRoomFacilitiesController = async (c: Context) => {
  try {
    const roomId = Number(c.req.param('id'))

    if (!Number.isInteger(roomId) || roomId <= 0) {
      return c.json({
        pesan: 'ID kamar tidak valid',
      }, 400)
    }

    const existingRoom = await getRoomById(roomId)

    if (!existingRoom) {
      return c.json({
        pesan: 'Kamar tidak ditemukan',
      }, 404)
    }

    const body = await c.req.json()
    const { facilityIds } = body as Record<string, unknown>

    if (
      !Array.isArray(facilityIds) ||
      !facilityIds.every(
        (id) => Number.isInteger(id) && Number(id) > 0
      )
    ) {
      return c.json({
        pesan: 'facilityIds harus berupa array berisi ID fasilitas yang valid',
      }, 400)
    }

    const uniqueFacilityIds = [...new Set(facilityIds as number[])]

    const updatedRoom = await updateRoomFacilities(
      roomId,
      uniqueFacilityIds
    )

    return c.json({
      pesan: 'Berhasil memperbarui fasilitas kamar',
      data: updatedRoom,
    })
  } catch (error) {
    console.error(error)

    return c.json({
      pesan: 'Gagal memperbarui fasilitas kamar. Pastikan semua ID fasilitas tersedia.',
    }, 500)
  }
}