import type { Context } from 'hono'

import {
  approveLeaseExtension,
  approveLeaseTermination,
  cancelLeaseExtension,
  cancelLeaseTermination,
  getLeaseRequests,
  rejectLeaseExtension,
  rejectLeaseTermination,
  requestLeaseExtension,
  requestLeaseTermination,
} from '../services/lease.service'
import { MAX_EXTENSION_MONTHS, parseDateOnly } from '../services/lease-dates'
import { syncRoomStatuses } from '../services/room-status.service'

const MAX_TEXT_LENGTH = 1000

// Kode error dari service -> [status HTTP, pesan untuk pengguna]
const errorMap: Record<string, [number, string]> = {
  LEASE_NOT_FOUND: [404, 'Kontrak sewa tidak ditemukan'],
  LEASE_NOT_ACTIVE: [400, 'Kontrak sewa tidak lagi aktif'],

  EXTENSION_NOT_FOUND: [404, 'Pengajuan perpanjangan tidak ditemukan'],
  EXTENSION_NOT_PENDING: [400, 'Pengajuan perpanjangan sudah pernah diproses'],
  EXTENSION_NOT_CANCELLABLE: [
    400,
    'Pengajuan perpanjangan ini tidak dapat dibatalkan',
  ],
  EXTENSION_PAYMENT_PENDING: [
    409,
    'Pembayaran perpanjangan sedang menunggu verifikasi Owner, belum bisa dibatalkan',
  ],
  EXTENSION_ALREADY_OPEN: [
    409,
    'Masih ada pengajuan perpanjangan yang belum selesai',
  ],
  EXTENSION_TOO_EARLY: [
    400,
    'Perpanjangan baru bisa diajukan 30 hari sebelum sewa berakhir',
  ],
  EXTENSION_PERIOD_EXPIRED: [
    400,
    'Masa pengajuan perpanjangan sudah berakhir. Silakan buat pemesanan baru',
  ],
  EXTENSION_ROOM_CONFLICT: [
    409,
    'Kamar sudah dipesan pihak lain pada periode perpanjangan tersebut',
  ],
  EXTENSION_MONTHS_INVALID: [
    400,
    `Lama perpanjangan harus 1 sampai ${MAX_EXTENSION_MONTHS} bulan`,
  ],

  TERMINATION_NOT_FOUND: [404, 'Pengajuan pindah tidak ditemukan'],
  TERMINATION_NOT_PENDING: [400, 'Pengajuan pindah sudah pernah diproses'],
  TERMINATION_NOT_CANCELLABLE: [
    400,
    'Pengajuan pindah yang sudah diproses tidak dapat dibatalkan. Hubungi Owner',
  ],
  TERMINATION_ALREADY_OPEN: [
    409,
    'Masih ada pengajuan pindah yang belum selesai',
  ],
  TERMINATION_AMOUNT_INVALID: [
    400,
    'Nominal pengembalian atau potongan tidak valid',
  ],
  MOVE_OUT_DATE_PAST: [400, 'Tanggal pindah tidak boleh sebelum hari ini'],
  MOVE_OUT_DATE_AFTER_END: [
    400,
    'Tanggal pindah harus sebelum tanggal berakhir sewa. Jika sama, sewa akan berakhir dengan sendirinya',
  ],
  MOVE_OUT_DATE_OUT_OF_RANGE: [
    400,
    'Tanggal pindah harus berada di dalam periode sewa',
  ],
}

const handleError = (c: Context, error: unknown, fallback: string) => {
  if (error instanceof Error && errorMap[error.message]) {
    const [status, pesan] = errorMap[error.message]
    return c.json({ pesan }, status as 400)
  }

  console.error(fallback, error)

  return c.json({ pesan: fallback }, 500)
}

const parseId = (value: string) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const cleanText = (value: unknown) =>
  typeof value === 'string' ? value.trim().slice(0, MAX_TEXT_LENGTH) : ''

const optionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  return Number(value)
}

/* ------------------------------ Tenant ------------------------------ */

export const requestExtensionController = async (c: Context) => {
  try {
    const user = c.get('authUser')
    const leaseId = parseId(c.req.param('leaseId'))

    if (!leaseId) {
      return c.json({ pesan: 'ID kontrak tidak valid' }, 400)
    }

    const body = await c.req.json().catch(() => ({}))

    const extension = await requestLeaseExtension({
      leaseId,
      userId: user.id,
      months: Number(body.months),
      tenantNote: cleanText(body.tenantNote),
    })

    return c.json(
      {
        pesan: 'Pengajuan perpanjangan berhasil dikirim dan menunggu persetujuan Owner',
        data: extension,
      },
      201
    )
  } catch (error) {
    return handleError(c, error, 'Gagal mengajukan perpanjangan sewa')
  }
}

export const cancelExtensionController = async (c: Context) => {
  try {
    const user = c.get('authUser')
    const id = parseId(c.req.param('id'))

    if (!id) {
      return c.json({ pesan: 'ID pengajuan tidak valid' }, 400)
    }

    const extension = await cancelLeaseExtension(id, user.id)

    return c.json({
      pesan: 'Pengajuan perpanjangan dibatalkan',
      data: extension,
    })
  } catch (error) {
    return handleError(c, error, 'Gagal membatalkan perpanjangan sewa')
  }
}

export const requestTerminationController = async (c: Context) => {
  try {
    const user = c.get('authUser')
    const leaseId = parseId(c.req.param('leaseId'))

    if (!leaseId) {
      return c.json({ pesan: 'ID kontrak tidak valid' }, 400)
    }

    const body = await c.req.json().catch(() => ({}))

    const requestedMoveOutDate = parseDateOnly(body.requestedMoveOutDate)

    if (!requestedMoveOutDate) {
      return c.json({ pesan: 'Tanggal pindah tidak valid' }, 400)
    }

    const reason = cleanText(body.reason)

    if (!reason) {
      return c.json({ pesan: 'Alasan pindah wajib diisi' }, 400)
    }

    const termination = await requestLeaseTermination({
      leaseId,
      userId: user.id,
      requestedMoveOutDate,
      reason,
      tenantNote: cleanText(body.tenantNote),
    })

    return c.json(
      {
        pesan: 'Pengajuan pindah berhasil dikirim dan menunggu persetujuan Owner',
        data: termination,
      },
      201
    )
  } catch (error) {
    return handleError(c, error, 'Gagal mengajukan pindah sewa')
  }
}

export const cancelTerminationController = async (c: Context) => {
  try {
    const user = c.get('authUser')
    const id = parseId(c.req.param('id'))

    if (!id) {
      return c.json({ pesan: 'ID pengajuan tidak valid' }, 400)
    }

    const termination = await cancelLeaseTermination(id, user.id)

    return c.json({
      pesan: 'Pengajuan pindah dibatalkan',
      data: termination,
    })
  } catch (error) {
    return handleError(c, error, 'Gagal membatalkan pengajuan pindah')
  }
}

/* ------------------------------- Owner ------------------------------ */

export const getLeaseRequestsController = async (c: Context) => {
  try {
    const data = await getLeaseRequests()

    return c.json({
      pesan: 'Berhasil mengambil pengajuan perpanjangan dan pindah',
      data,
    })
  } catch (error) {
    return handleError(c, error, 'Gagal mengambil pengajuan')
  }
}

export const approveExtensionController = async (c: Context) => {
  try {
    const id = parseId(c.req.param('id'))

    if (!id) {
      return c.json({ pesan: 'ID pengajuan tidak valid' }, 400)
    }

    const body = await c.req.json().catch(() => ({}))

    const extension = await approveLeaseExtension({
      id,
      ownerNote: cleanText(body.ownerNote),
    })

    return c.json({
      pesan:
        'Perpanjangan disetujui. Tagihan perpanjangan sudah dibuat untuk Tenant',
      data: extension,
    })
  } catch (error) {
    return handleError(c, error, 'Gagal menyetujui perpanjangan')
  }
}

export const rejectExtensionController = async (c: Context) => {
  try {
    const id = parseId(c.req.param('id'))

    if (!id) {
      return c.json({ pesan: 'ID pengajuan tidak valid' }, 400)
    }

    const body = await c.req.json().catch(() => ({}))
    const ownerNote = cleanText(body.ownerNote)

    if (!ownerNote) {
      return c.json({ pesan: 'Alasan penolakan wajib diisi' }, 400)
    }

    const extension = await rejectLeaseExtension({ id, ownerNote })

    return c.json({
      pesan: 'Perpanjangan ditolak',
      data: extension,
    })
  } catch (error) {
    return handleError(c, error, 'Gagal menolak perpanjangan')
  }
}

export const approveTerminationController = async (c: Context) => {
  try {
    const id = parseId(c.req.param('id'))

    if (!id) {
      return c.json({ pesan: 'ID pengajuan tidak valid' }, 400)
    }

    const body = await c.req.json().catch(() => ({}))

    let actualMoveOutDate: Date | undefined

    if (body.actualMoveOutDate) {
      const parsed = parseDateOnly(body.actualMoveOutDate)

      if (!parsed) {
        return c.json({ pesan: 'Tanggal pindah tidak valid' }, 400)
      }

      actualMoveOutDate = parsed
    }

    const termination = await approveLeaseTermination({
      id,
      ownerNote: cleanText(body.ownerNote),
      actualMoveOutDate,
      refundAmount: optionalNumber(body.refundAmount),
      deductionAmount: optionalNumber(body.deductionAmount),
    })

    // Supaya status kamar & kontrak langsung ikut berubah tanpa menunggu
    // sinkronisasi 60 detik berikutnya
    await syncRoomStatuses().catch((error) =>
      console.error('Sinkronisasi setelah pindah gagal:', error)
    )

    return c.json({
      pesan: 'Pengajuan pindah disetujui',
      data: termination,
    })
  } catch (error) {
    return handleError(c, error, 'Gagal menyetujui pengajuan pindah')
  }
}

export const rejectTerminationController = async (c: Context) => {
  try {
    const id = parseId(c.req.param('id'))

    if (!id) {
      return c.json({ pesan: 'ID pengajuan tidak valid' }, 400)
    }

    const body = await c.req.json().catch(() => ({}))
    const ownerNote = cleanText(body.ownerNote)

    if (!ownerNote) {
      return c.json({ pesan: 'Alasan penolakan wajib diisi' }, 400)
    }

    const termination = await rejectLeaseTermination({ id, ownerNote })

    return c.json({
      pesan: 'Pengajuan pindah ditolak',
      data: termination,
    })
  } catch (error) {
    return handleError(c, error, 'Gagal menolak pengajuan pindah')
  }
}
