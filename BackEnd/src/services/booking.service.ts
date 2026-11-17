import { prisma } from "../lib/prisma";
import { hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { generateActivationToken } from "./auth.service";
import { hasApprovedExtensionConflict } from "./lease.service";

type CreateBookingInput = {
  roomId: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  startDate: Date;
  endDate?: Date;
  message?: string;
};

export const getAllBookings = async () => {
  return await prisma.booking.findMany({
    include: {
      room: {
        include: {
          roomType: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          mustChangePassword: true,
          activationExpiresAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getBookingById = async (id: number) => {
  return await prisma.booking.findUnique({
    where: { id },
    include: {
      room: {
        include: {
          roomType: true,
          facilities: {
            include: {
              facility: true,
            },
          },
        },
      },
    },
  });
};

export const createBooking = async (data: CreateBookingInput) => {
  return await prisma.booking.create({
    data: {
      roomId: data.roomId,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      startDate: data.startDate,
      endDate: data.endDate,
      message: data.message,
      status: "PENDING",
    },
    include: {
      room: {
        include: {
          roomType: true,
        },
      },
    },
  });
};

export const checkRoomAvailability = async (
  roomId: number,
  startDate: Date,
  endDate?: Date,
) => {
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      roomId,
      status: {
        in: ["PENDING", "APPROVED"],
      },
      ...(endDate
        ? {
          startDate: {
            lt: endDate,
          },
        }
        : {}),
      OR: [
        {
          endDate: null,
        },
        {
          endDate: {
            gt: startDate,
          },
        },
      ],
    },
  });

  if (conflictingBooking) {
    return false;
  }

  const conflictingLease = await prisma.lease.findFirst({
    where: {
      roomId,
      status: "ACTIVE",
      ...(endDate
        ? {
          startDate: {
            lt: endDate,
          },
        }
        : {}),
      endDate: {
        gt: startDate,
      },
    },
  });

  if (conflictingLease) {
    return false;
  }

  // Perpanjangan yang sudah disetujui (menunggu pembayaran) juga menahan kamar
  return !(await hasApprovedExtensionConflict(
    prisma,
    roomId,
    startDate,
    endDate,
  ));
};

export const updateBookingStatus = async (
  id: number,
  status: "APPROVED" | "REJECTED" | "CANCELLED",
) => {
  return await prisma.booking.update({
    where: { id },
    data: { status },
    include: {
      room: {
        include: {
          roomType: true,
        },
      },
    },
  });
};

export const approveBooking = async (id: number) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Ambil data pemesanan
    const booking = await tx.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
      },
    })

    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND')
    }

    if (booking.status !== 'PENDING') {
      throw new Error('BOOKING_NOT_PENDING')
    }

    if (!booking.endDate) {
      throw new Error('BOOKING_END_DATE_REQUIRED')
    }

    // 2. Periksa bentrok jadwal pemesanan
    const conflictingBooking = await tx.booking.findFirst({
      where: {
        id: { not: id },
        roomId: booking.roomId,
        status: {
          in: ['PENDING', 'APPROVED'],
        },
        startDate: {
          lt: booking.endDate,
        },
        OR: [
          { endDate: null },
          {
            endDate: {
              gt: booking.startDate,
            },
          },
        ],
      },
    })

    if (conflictingBooking) {
      throw new Error('ROOM_BOOKING_CONFLICT')
    }

    // 3. Periksa bentrok kontrak sewa
    const conflictingLease = await tx.lease.findFirst({
      where: {
        roomId: booking.roomId,
        status: 'ACTIVE',
        startDate: {
          lt: booking.endDate,
        },
        endDate: {
          gt: booking.startDate,
        },
      },
    })

    if (conflictingLease) {
      throw new Error('ROOM_LEASE_CONFLICT')
    }

    const conflictingExtension = await hasApprovedExtensionConflict(
      tx,
      booking.roomId,
      booking.startDate,
      booking.endDate,
    )

    if (conflictingExtension) {
      throw new Error('ROOM_LEASE_CONFLICT')
    }

    // 4. Cari akun berdasarkan email
    const email = booking.guestEmail.trim().toLowerCase()

    let user = await tx.user.findUnique({
      where: { email },
    })

    let activationToken: string | null = null

    if (user && user.role !== 'TENANT') {
      throw new Error('EMAIL_BELONGS_TO_OWNER')
    }

    if (user && booking.userId !== user.id) {
      throw new Error('EMAIL_ALREADY_REGISTERED')
    }

    // 5. Buat akun Tenant jika belum tersedia
    if (!user) {
      const temporaryPassword = randomBytes(32).toString('hex')
      const hashedPassword = await hash(temporaryPassword, 12)

      const activation = generateActivationToken()

      activationToken = activation.token

      user = await tx.user.create({
        data: {
          name: booking.guestName,
          email,
          phone: booking.guestPhone,
          password: hashedPassword,
          role: 'TENANT',
          isActive: true,
          mustChangePassword: true,
          activationTokenHash: activation.tokenHash,
          activationExpiresAt: activation.expiresAt,
        },
      })
    }

    // 6. Hubungkan Booking dengan Tenant
    await tx.booking.update({
      where: { id },
      data: {
        userId: user.id,
      },
    })

    // 7. Tentukan harga sewa
    const monthlyPrice =
      booking.room.price ?? booking.room.roomType.basePrice

    // 8. Buat kontrak sewa

    // 8. Buat kontrak sewa
    const lease = await tx.lease.create({
      data: {
        bookingId: booking.id,
        userId: user.id,
        roomId: booking.roomId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        monthlyPrice,
        status: 'ACTIVE',
      },
    })

    // 9. Buat tagihan bulanan otomatis
    const invoices = []

    const startDate = new Date(booking.startDate)
    const endDate = new Date(booking.endDate)

    const startDay = startDate.getUTCDate()

    let period = 0

    while (true) {
      const year = startDate.getUTCFullYear()
      const month = startDate.getUTCMonth() + period

      // Tentukan tanggal tagihan setiap bulan
      const lastDayOfMonth = new Date(
        Date.UTC(year, month + 1, 0)
      ).getUTCDate()

      const billingDate = new Date(
        Date.UTC(
          year,
          month,
          Math.min(startDay, lastDayOfMonth)
        )
      )

      // Berhenti jika tanggal tagihan sudah mencapai akhir sewa
      if (billingDate >= endDate) {
        break
      }

      const invoiceYear = billingDate.getUTCFullYear()
      const invoiceMonth = String(
        billingDate.getUTCMonth() + 1
      ).padStart(2, '0')

      const invoiceDay = String(
        billingDate.getUTCDate()
      ).padStart(2, '0')

      const invoiceNumber =
        `INV-${lease.id}-${invoiceYear}${invoiceMonth}`

      invoices.push({
        leaseId: lease.id,
        invoiceNumber,
        amount: monthlyPrice,
        dueDate: billingDate,
        status: 'UNPAID' as const,
        description: `Tagihan sewa kamar ${booking.room.roomNumber} periode ${invoiceMonth}/${invoiceYear}`,
      })

      period++
    }

    // Simpan seluruh tagihan ke database
    // Debug proses pembuatan tagihan
console.log('Tanggal mulai:', startDate)
console.log('Tanggal selesai:', endDate)
console.log('Jumlah invoice yang dibuat:', invoices.length)
console.log('Data invoice:', invoices)

// Simpan seluruh tagihan ke database
if (invoices.length > 0) {
  await tx.invoice.createMany({
    data: invoices,
  })
}

    // 10. Tentukan status kamar berdasarkan tanggal mulai sewa
    const now = new Date()

    const roomStatus =
      booking.startDate > now ? 'RESERVED' : 'OCCUPIED'

    // 11. Ubah status kamar
    await tx.room.update({
      where: {
        id: booking.roomId,
      },
      data: {
        status: roomStatus,
      },
    })


    // 11. Ubah status Booking
    const updatedBooking = await tx.booking.update({
      where: { id },
      data: {
        status: 'APPROVED',
      },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    })

    return {
      booking: updatedBooking,
      activationToken,
    }
  })
}

/**
 * Membuat token aktivasi baru untuk Tenant yang belum mengaktivasi akun.
 * Token asli tidak pernah disimpan (hanya hash-nya), sehingga token lama tidak
 * bisa ditampilkan ulang. Token baru menggantikan token lama.
 */
export const regenerateActivationToken = async (bookingId: number) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true },
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (booking.status !== "APPROVED") {
    throw new Error("BOOKING_NOT_APPROVED");
  }

  if (!booking.user || booking.user.role !== "TENANT") {
    throw new Error("TENANT_NOT_FOUND");
  }

  if (!booking.user.mustChangePassword) {
    throw new Error("ACCOUNT_ALREADY_ACTIVATED");
  }

  const activation = generateActivationToken();

  await prisma.user.update({
    where: { id: booking.user.id },
    data: {
      activationTokenHash: activation.tokenHash,
      activationExpiresAt: activation.expiresAt,
    },
  });

  return {
    activationToken: activation.token,
    expiresAt: activation.expiresAt,
  };
};
