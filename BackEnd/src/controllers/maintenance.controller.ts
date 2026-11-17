
import type { Context } from 'hono'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

import {
  createMaintenanceRequest,
  getTenantMaintenanceRequests,
  getAllMaintenanceRequests,
  updateMaintenanceStatus,
} from '../services/maintenance.service'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const allowedMimeTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

// Tenant membuat laporan keluhan
export const createMaintenanceController = async (c: Context) => {
  let uploadedFilePath: string | null = null

  try {
    const user = c.get('authUser')
    const body = await c.req.parseBody()

    const leaseId = Number(body.leaseId)
    const roomId = Number(body.roomId)
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : ''

    if (
      !Number.isInteger(leaseId) ||
      leaseId <= 0 ||
      !Number.isInteger(roomId) ||
      roomId <= 0
    ) {
      return c.json(
        { pesan: 'ID lease atau kamar tidak valid.' },
        400
      )
    }

    if (!title || !description) {
      return c.json(
        { pesan: 'Judul dan deskripsi keluhan wajib diisi.' },
        400
      )
    }

    let photoUrl: string | undefined

    const photo = body.photo

    if (photo && typeof photo !== 'string') {
      if (!(photo instanceof File)) {
        return c.json({ pesan: 'Format foto tidak valid.' }, 400)
      }

      if (!allowedMimeTypes[photo.type]) {
        return c.json(
          { pesan: 'Foto harus berformat JPG, PNG, atau WEBP.' },
          400
        )
      }

      if (photo.size > MAX_FILE_SIZE) {
        return c.json(
          { pesan: 'Ukuran foto maksimal 5 MB.' },
          400
        )
      }

      const uploadDirectory = join(
        process.cwd(),
        'uploads',
        'maintenance'
      )

      await mkdir(uploadDirectory, { recursive: true })

      const extension = allowedMimeTypes[photo.type]
      const filename = `${randomUUID()}${extension}`

      uploadedFilePath = join(uploadDirectory, filename)

      const buffer = Buffer.from(await photo.arrayBuffer())

      await writeFile(uploadedFilePath, buffer)

      photoUrl = `/uploads/maintenance/${filename}`
    }

    const data = await createMaintenanceRequest({
      leaseId,
      roomId,
      userId: user.id,
      title,
      description,
      photoUrl,
    })

    return c.json(
      {
        pesan: 'Laporan keluhan berhasil dibuat.',
        data,
      },
      201
    )
  } catch (error) {
    // Hapus file jika penyimpanan laporan ke database gagal
    if (uploadedFilePath) {
      const { unlink } = await import('node:fs/promises')
      await unlink(uploadedFilePath).catch(() => {})
    }

    console.error('Create maintenance error:', error)

    if (
      error instanceof Error &&
      error.message === 'ACTIVE_LEASE_NOT_FOUND'
    ) {
      return c.json(
        { pesan: 'Lease aktif tidak ditemukan untuk kamar tersebut.' },
        404
      )
    }

    return c.json(
      { pesan: 'Gagal membuat laporan keluhan.' },
      500
    )
  }
}

// Tenant melihat laporan miliknya
export const getTenantMaintenanceController = async (c: Context) => {
  try {
    const user = c.get('authUser')
    const data = await getTenantMaintenanceRequests(user.id)

    return c.json({
      pesan: 'Berhasil mengambil laporan keluhan Tenant.',
      data,
    })
  } catch (error) {
    console.error('Get tenant maintenance error:', error)

    return c.json(
      { pesan: 'Gagal mengambil laporan keluhan.' },
      500
    )
  }
}

// Owner melihat seluruh laporan
export const getAllMaintenanceController = async (c: Context) => {
  try {
    const data = await getAllMaintenanceRequests()

    return c.json({
      pesan: 'Berhasil mengambil seluruh laporan keluhan.',
      data,
    })
  } catch (error) {
    console.error('Get all maintenance error:', error)

    return c.json(
      { pesan: 'Gagal mengambil laporan keluhan.' },
      500
    )
  }
}

// Owner mengubah status laporan
export const updateMaintenanceStatusController = async (c: Context) => {
  try {
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json(
        { pesan: 'ID laporan tidak valid.' },
        400
      )
    }

    const body = await c.req.json()

    const allowedStatuses = [
      'PROCESSING',
      'COMPLETED',
      'REJECTED',
    ] as const

    const status = body.status
    const ownerNote =
      typeof body.ownerNote === 'string'
        ? body.ownerNote.trim()
        : undefined

    if (!allowedStatuses.includes(status)) {
      return c.json(
        { pesan: 'Status laporan tidak valid.' },
        400
      )
    }

    const data = await updateMaintenanceStatus(
      id,
      status,
      ownerNote
    )

    return c.json({
      pesan: 'Status laporan berhasil diperbarui.',
      data,
    })
  } catch (error) {
    console.error('Update maintenance status error:', error)

    if (
      error instanceof Error &&
      error.message === 'MAINTENANCE_NOT_FOUND'
    ) {
      return c.json(
        { pesan: 'Laporan keluhan tidak ditemukan.' },
        404
      )
    }

    return c.json(
      { pesan: 'Gagal memperbarui status laporan.' },
      500
    )
  }
}
