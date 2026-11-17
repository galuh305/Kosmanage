import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'
import {
  EXTENSION_INVOICE_DUE_DAYS,
  LEASE_EXTENSION_GRACE_DAYS,
  LEASE_EXTENSION_WINDOW_DAYS,
  MAX_EXTENSION_MONTHS,
  addDaysUTC,
  addMonthsUTC,
  isWithinExtensionWindow,
  startOfUTCDay,
} from './lease-dates'

type Db = Prisma.TransactionClient

const FAR_FUTURE = new Date('9999-12-31T00:00:00.000Z')

const formatDateID = (date: Date) =>
  date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

/* ------------------------------------------------------------------ */
/* Pengecekan bentrok jadwal                                           */
/* ------------------------------------------------------------------ */

// Apakah ada perpanjangan yang SUDAH DISETUJUI (menunggu pembayaran) dari
// kontrak lain yang menempati kamar yang sama pada rentang from-to?
// Dipakai booking.service supaya kamar tidak dipesan orang lain selagi
// tenant lama masih punya hak atas masa perpanjangannya.
export const hasApprovedExtensionConflict = async (
  db: Db,
  roomId: number,
  from: Date,
  to: Date = FAR_FUTURE,
  excludeLeaseId?: number
) => {
  const conflict = await db.leaseExtension.findFirst({
    where: {
      status: 'APPROVED',
      ...(excludeLeaseId ? { leaseId: { not: excludeLeaseId } } : {}),
      approvedEndDate: { gt: from },
      lease: {
        is: {
          roomId,
          status: 'ACTIVE',
          endDate: { lt: to },
        },
      },
    },
    select: { id: true },
  })

  return Boolean(conflict)
}

// Apakah kamar bebas pada rentang from-to untuk masa perpanjangan sebuah lease?
const hasRoomConflictForExtension = async (
  db: Db,
  lease: { id: number; roomId: number; bookingId: number },
  from: Date,
  to: Date
) => {
  const conflictingBooking = await db.booking.findFirst({
    where: {
      id: { not: lease.bookingId },
      roomId: lease.roomId,
      status: { in: ['PENDING', 'APPROVED'] },
      startDate: { lt: to },
      OR: [{ endDate: null }, { endDate: { gt: from } }],
    },
    select: { id: true },
  })

  if (conflictingBooking) return true

  const conflictingLease = await db.lease.findFirst({
    where: {
      id: { not: lease.id },
      roomId: lease.roomId,
      status: 'ACTIVE',
      startDate: { lt: to },
      endDate: { gt: from },
    },
    select: { id: true },
  })

  if (conflictingLease) return true

  return await hasApprovedExtensionConflict(
    db,
    lease.roomId,
    from,
    to,
    lease.id
  )
}

/* ------------------------------------------------------------------ */
/* Perpanjangan sewa                                                   */
/* ------------------------------------------------------------------ */

type RequestExtensionInput = {
  leaseId: number
  userId: number
  months: number
  tenantNote?: string
}

export const requestLeaseExtension = async ({
  leaseId,
  userId,
  months,
  tenantNote,
}: RequestExtensionInput) => {
  if (
    !Number.isInteger(months) ||
    months < 1 ||
    months > MAX_EXTENSION_MONTHS
  ) {
    throw new Error('EXTENSION_MONTHS_INVALID')
  }

  return await prisma.$transaction(async (tx) => {
    const lease = await tx.lease.findFirst({
      where: { id: leaseId, userId },
    })

    if (!lease) throw new Error('LEASE_NOT_FOUND')

    if (lease.status !== 'ACTIVE') throw new Error('LEASE_NOT_ACTIVE')

    const now = new Date()

    if (!isWithinExtensionWindow(lease.endDate, now)) {
      const windowStart = addDaysUTC(
        lease.endDate,
        -LEASE_EXTENSION_WINDOW_DAYS
      )

      throw new Error(
        now < windowStart
          ? 'EXTENSION_TOO_EARLY'
          : 'EXTENSION_PERIOD_EXPIRED'
      )
    }

    const openExtension = await tx.leaseExtension.findFirst({
      where: {
        leaseId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      select: { id: true },
    })

    if (openExtension) throw new Error('EXTENSION_ALREADY_OPEN')

    const openTermination = await tx.leaseTermination.findFirst({
      where: {
        leaseId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      select: { id: true },
    })

    if (openTermination) throw new Error('TERMINATION_ALREADY_OPEN')

    const requestedEndDate = addMonthsUTC(lease.endDate, months)

    const hasConflict = await hasRoomConflictForExtension(
      tx,
      lease,
      lease.endDate,
      requestedEndDate
    )

    if (hasConflict) throw new Error('EXTENSION_ROOM_CONFLICT')

    return await tx.leaseExtension.create({
      data: {
        leaseId,
        requestedMonths: months,
        requestedEndDate,
        tenantNote: tenantNote || null,
        status: 'PENDING',
      },
    })
  })
}

export const cancelLeaseExtension = async (
  extensionId: number,
  userId: number
) => {
  return await prisma.$transaction(async (tx) => {
    const extension = await tx.leaseExtension.findFirst({
      where: {
        id: extensionId,
        lease: { is: { userId } },
      },
      include: {
        invoice: {
          include: {
            payments: {
              where: { transactionStatus: 'PENDING_VERIFICATION' },
              select: { id: true },
            },
          },
        },
      },
    })

    if (!extension) throw new Error('EXTENSION_NOT_FOUND')

    if (!['PENDING', 'APPROVED'].includes(extension.status)) {
      throw new Error('EXTENSION_NOT_CANCELLABLE')
    }

    if (extension.invoice) {
      // Jangan batalkan kalau tenant sudah mengunggah bukti transfer
      // yang sedang menunggu verifikasi owner.
      if (extension.invoice.payments.length > 0) {
        throw new Error('EXTENSION_PAYMENT_PENDING')
      }

      if (extension.invoice.status === 'PAID') {
        throw new Error('EXTENSION_NOT_CANCELLABLE')
      }

      await tx.invoice.update({
        where: { id: extension.invoice.id },
        data: { status: 'CANCELLED' },
      })
    }

    return await tx.leaseExtension.update({
      where: { id: extensionId },
      data: { status: 'CANCELLED' },
    })
  })
}

type OwnerDecisionInput = {
  id: number
  ownerNote?: string
}

export const approveLeaseExtension = async ({
  id,
  ownerNote,
}: OwnerDecisionInput) => {
  return await prisma.$transaction(async (tx) => {
    const extension = await tx.leaseExtension.findUnique({
      where: { id },
      include: {
        lease: { include: { room: true } },
      },
    })

    if (!extension) throw new Error('EXTENSION_NOT_FOUND')

    if (extension.status !== 'PENDING') {
      throw new Error('EXTENSION_NOT_PENDING')
    }

    const { lease } = extension

    if (lease.status !== 'ACTIVE') throw new Error('LEASE_NOT_ACTIVE')

    // Cek ulang: bisa jadi ada pemesanan lain yang masuk setelah tenant mengajukan
    const hasConflict = await hasRoomConflictForExtension(
      tx,
      lease,
      lease.endDate,
      extension.requestedEndDate
    )

    if (hasConflict) throw new Error('EXTENSION_ROOM_CONFLICT')

    const now = new Date()
    const amount = lease.monthlyPrice.mul(extension.requestedMonths)

    const invoice = await tx.invoice.create({
      data: {
        leaseId: lease.id,
        invoiceNumber: `INV-${lease.id}-EXT${extension.id}`,
        amount,
        dueDate: addDaysUTC(now, EXTENSION_INVOICE_DUE_DAYS),
        status: 'UNPAID',
        description:
          `Perpanjangan sewa kamar ${lease.room.roomNumber} ` +
          `selama ${extension.requestedMonths} bulan ` +
          `(${formatDateID(lease.endDate)} - ` +
          `${formatDateID(extension.requestedEndDate)})`,
      },
    })

    return await tx.leaseExtension.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedEndDate: extension.requestedEndDate,
        approvedAt: now,
        ownerNote: ownerNote || null,
        invoiceId: invoice.id,
      },
      include: { invoice: true },
    })
  })
}

export const rejectLeaseExtension = async ({
  id,
  ownerNote,
}: OwnerDecisionInput) => {
  return await prisma.$transaction(async (tx) => {
    const extension = await tx.leaseExtension.findUnique({
      where: { id },
    })

    if (!extension) throw new Error('EXTENSION_NOT_FOUND')

    if (extension.status !== 'PENDING') {
      throw new Error('EXTENSION_NOT_PENDING')
    }

    return await tx.leaseExtension.update({
      where: { id },
      data: {
        status: 'REJECTED',
        ownerNote: ownerNote || null,
      },
    })
  })
}

// Dipanggil dari approvePayment() setelah invoice berubah menjadi PAID.
// Jika invoice itu adalah tagihan perpanjangan, masa sewa benar-benar
// diperpanjang di sini.
export const completeExtensionForInvoice = async (
  tx: Db,
  invoiceId: number
) => {
  const extension = await tx.leaseExtension.findUnique({
    where: { invoiceId },
  })

  if (!extension || extension.status !== 'APPROVED') return null

  const lease = await tx.lease.findUnique({
    where: { id: extension.leaseId },
  })

  if (!lease) return null

  const newEndDate = extension.approvedEndDate ?? extension.requestedEndDate

  // Hanya geser tanggal berakhir ke depan, tidak pernah memundurkan
  if (lease.status === 'ACTIVE' && newEndDate > lease.endDate) {
    await tx.lease.update({
      where: { id: lease.id },
      data: { endDate: newEndDate },
    })
  }

  return await tx.leaseExtension.update({
    where: { id: extension.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })
}

/* ------------------------------------------------------------------ */
/* Pindah / berhenti sewa lebih awal                                   */
/* ------------------------------------------------------------------ */

type RequestTerminationInput = {
  leaseId: number
  userId: number
  requestedMoveOutDate: Date
  reason: string
  tenantNote?: string
}

export const requestLeaseTermination = async ({
  leaseId,
  userId,
  requestedMoveOutDate,
  reason,
  tenantNote,
}: RequestTerminationInput) => {
  return await prisma.$transaction(async (tx) => {
    const lease = await tx.lease.findFirst({
      where: { id: leaseId, userId },
    })

    if (!lease) throw new Error('LEASE_NOT_FOUND')

    if (lease.status !== 'ACTIVE') throw new Error('LEASE_NOT_ACTIVE')

    const today = startOfUTCDay(new Date())
    const leaseStart = startOfUTCDay(lease.startDate)
    const leaseEnd = startOfUTCDay(lease.endDate)

    const earliest = leaseStart > today ? leaseStart : today

    if (requestedMoveOutDate < earliest) {
      throw new Error('MOVE_OUT_DATE_PAST')
    }

    // Kalau tanggal pindah sama dengan / setelah akhir sewa, tidak perlu
    // pengajuan: sewa memang akan berakhir sendiri.
    if (requestedMoveOutDate >= leaseEnd) {
      throw new Error('MOVE_OUT_DATE_AFTER_END')
    }

    const openExtension = await tx.leaseExtension.findFirst({
      where: {
        leaseId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      select: { id: true },
    })

    if (openExtension) throw new Error('EXTENSION_ALREADY_OPEN')

    const openTermination = await tx.leaseTermination.findFirst({
      where: {
        leaseId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      select: { id: true },
    })

    if (openTermination) throw new Error('TERMINATION_ALREADY_OPEN')

    return await tx.leaseTermination.create({
      data: {
        leaseId,
        requestedMoveOutDate,
        reason,
        tenantNote: tenantNote || null,
        status: 'PENDING',
      },
    })
  })
}

// Tenant hanya bisa membatalkan pengajuan yang belum diproses owner.
// Setelah disetujui, tanggal sewa sudah diubah, jadi pembatalan harus
// lewat owner.
export const cancelLeaseTermination = async (
  terminationId: number,
  userId: number
) => {
  return await prisma.$transaction(async (tx) => {
    const termination = await tx.leaseTermination.findFirst({
      where: {
        id: terminationId,
        lease: { is: { userId } },
      },
    })

    if (!termination) throw new Error('TERMINATION_NOT_FOUND')

    if (termination.status !== 'PENDING') {
      throw new Error('TERMINATION_NOT_CANCELLABLE')
    }

    return await tx.leaseTermination.update({
      where: { id: terminationId },
      data: { status: 'CANCELLED' },
    })
  })
}

type ApproveTerminationInput = {
  id: number
  ownerNote?: string
  actualMoveOutDate?: Date
  refundAmount?: number
  deductionAmount?: number
}

export const approveLeaseTermination = async ({
  id,
  ownerNote,
  actualMoveOutDate,
  refundAmount,
  deductionAmount,
}: ApproveTerminationInput) => {
  if (
    (refundAmount !== undefined &&
      (!Number.isFinite(refundAmount) || refundAmount < 0)) ||
    (deductionAmount !== undefined &&
      (!Number.isFinite(deductionAmount) || deductionAmount < 0))
  ) {
    throw new Error('TERMINATION_AMOUNT_INVALID')
  }

  return await prisma.$transaction(async (tx) => {
    const termination = await tx.leaseTermination.findUnique({
      where: { id },
      include: { lease: true },
    })

    if (!termination) throw new Error('TERMINATION_NOT_FOUND')

    if (termination.status !== 'PENDING') {
      throw new Error('TERMINATION_NOT_PENDING')
    }

    const { lease } = termination

    if (lease.status !== 'ACTIVE') throw new Error('LEASE_NOT_ACTIVE')

    const moveOutDate = actualMoveOutDate ?? termination.requestedMoveOutDate

    // Owner boleh mengisi tanggal yang sudah lewat (tenant ternyata sudah
    // pergi), tapi tidak boleh sebelum sewa mulai atau setelah sewa berakhir.
    if (
      moveOutDate < startOfUTCDay(lease.startDate) ||
      moveOutDate > lease.endDate
    ) {
      throw new Error('MOVE_OUT_DATE_OUT_OF_RANGE')
    }

    const now = new Date()

    // 1. Catat keputusan
    const updated = await tx.leaseTermination.update({
      where: { id },
      data: {
        status: 'APPROVED',
        actualMoveOutDate: moveOutDate,
        refundAmount: refundAmount ?? null,
        deductionAmount: deductionAmount ?? null,
        ownerNote: ownerNote || null,
        approvedAt: now,
      },
    })

    // 2. Majukan tanggal berakhir sewa ke tanggal pindah. Dengan begitu
    //    kamar otomatis bebas untuk dipesan mulai tanggal tersebut.
    await tx.lease.update({
      where: { id: lease.id },
      data: { endDate: moveOutDate },
    })

    // 3. Booking asal juga dipersingkat; kalau tidak, booking lama masih
    //    memblokir kamar sampai tanggal akhir yang lama.
    await tx.booking.update({
      where: { id: lease.bookingId },
      data: { endDate: moveOutDate },
    })

    // 4. Batalkan tagihan bulanan yang belum dibayar untuk periode yang
    //    dimulai pada/setelah tanggal pindah. Tagihan yang sudah PAID atau
    //    sedang menunggu verifikasi tidak disentuh.
    await tx.invoice.updateMany({
      where: {
        leaseId: lease.id,
        status: { in: ['UNPAID', 'OVERDUE'] },
        dueDate: { gte: moveOutDate },
        payments: {
          none: { transactionStatus: 'PENDING_VERIFICATION' },
        },
      },
      data: { status: 'CANCELLED' },
    })

    return updated
  })
}

export const rejectLeaseTermination = async ({
  id,
  ownerNote,
}: OwnerDecisionInput) => {
  return await prisma.$transaction(async (tx) => {
    const termination = await tx.leaseTermination.findUnique({
      where: { id },
    })

    if (!termination) throw new Error('TERMINATION_NOT_FOUND')

    if (termination.status !== 'PENDING') {
      throw new Error('TERMINATION_NOT_PENDING')
    }

    return await tx.leaseTermination.update({
      where: { id },
      data: {
        status: 'REJECTED',
        ownerNote: ownerNote || null,
      },
    })
  })
}

/* ------------------------------------------------------------------ */
/* Daftar pengajuan untuk owner                                        */
/* ------------------------------------------------------------------ */

const leaseSummaryInclude = {
  lease: {
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      room: { select: { id: true, roomNumber: true, name: true } },
    },
  },
} as const

export const getLeaseRequests = async () => {
  const [extensions, terminations] = await Promise.all([
    prisma.leaseExtension.findMany({
      include: { ...leaseSummaryInclude, invoice: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.leaseTermination.findMany({
      include: leaseSummaryInclude,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return { extensions, terminations }
}

/* ------------------------------------------------------------------ */
/* Penyelesaian otomatis (dipanggil dari sinkronisasi berkala)         */
/* ------------------------------------------------------------------ */

export const finalizeEndedLeases = async () => {
  const now = new Date()

  // 1. Pindah lebih awal yang sudah disetujui dan tanggalnya sudah tiba:
  //    kontrak menjadi TERMINATED.
  const dueTerminations = await prisma.leaseTermination.findMany({
    where: {
      status: 'APPROVED',
      actualMoveOutDate: { lte: now },
      lease: { is: { status: 'ACTIVE' } },
    },
    select: { id: true, leaseId: true },
  })

  for (const termination of dueTerminations) {
    await prisma.$transaction(async (tx) => {
      await tx.lease.update({
        where: { id: termination.leaseId },
        data: { status: 'TERMINATED' },
      })

      await tx.leaseTermination.update({
        where: { id: termination.id },
        data: { status: 'COMPLETED', completedAt: now },
      })
    })
  }

  // 2. Sewa yang berakhir normal dan sudah lewat masa tenggang
  //    perpanjangan: kontrak menjadi COMPLETED.
  //    Kontrak dengan perpanjangan yang sudah disetujui (menunggu bayar)
  //    sengaja dilewati sampai owner/tenant menyelesaikannya.
  const expiredLeases = await prisma.lease.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: addDaysUTC(now, -LEASE_EXTENSION_GRACE_DAYS) },
      extensions: { none: { status: 'APPROVED' } },
      terminations: { none: { status: 'APPROVED' } },
    },
    select: { id: true },
  })

  if (expiredLeases.length > 0) {
    const ids = expiredLeases.map((lease) => lease.id)

    await prisma.$transaction([
      // Pengajuan yang tidak sempat diproses ikut ditutup
      prisma.leaseExtension.updateMany({
        where: { leaseId: { in: ids }, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      }),
      prisma.leaseTermination.updateMany({
        where: { leaseId: { in: ids }, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      }),
      prisma.lease.updateMany({
        where: { id: { in: ids } },
        data: { status: 'COMPLETED' },
      }),
    ])
  }

  return {
    terminated: dueTerminations.length,
    completed: expiredLeases.length,
  }
}
