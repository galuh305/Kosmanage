
import { prisma } from '../lib/prisma'


export const getDashboardSummary = async () => {
  const [
    totalRooms,
    availableRooms,
    occupiedRooms,
    reservedRooms,
    maintenanceRooms,
    totalBookings,
    pendingBookings,
  ] = await Promise.all([
    prisma.room.count(),

    prisma.room.count({
      where: { status: 'AVAILABLE' },
    }),

    prisma.room.count({
      where: { status: 'OCCUPIED' },
    }),

    prisma.room.count({
      where: { status: 'RESERVED' },
    }),

    prisma.room.count({
      where: { status: 'MAINTENANCE' },
    }),

    prisma.booking.count(),

    prisma.booking.count({
      where: { status: 'PENDING' },
    }),
  ])

  return {
    rooms: {
      total: totalRooms,
      available: availableRooms,
      occupied: occupiedRooms,
      reserved: reservedRooms,
      maintenance: maintenanceRooms,
    },
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
    },
  }
}


export const getPaymentStatistics = async () => {
  const [
    successfulPayments,
    pendingPayments,
    failedPayments,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: {
        transactionStatus: 'APPROVED',
      },
      select: {
        amount: true,
      },
    }),

    prisma.payment.count({
      where: {
        transactionStatus: 'PENDING_VERIFICATION',
      },
    }),

    prisma.payment.count({
      where: {
        transactionStatus: 'REJECTED',
      },
    }),
  ])

  const totalRevenue = successfulPayments.reduce(
    (total, payment) => total + Number(payment.amount),
    0
  )

  return {
    totalRevenue,
    successfulTransactions: successfulPayments.length,
    pendingTransactions: pendingPayments,
    failedTransactions: failedPayments,
  }
}


export const getMonthlyRevenue = async () => {
  const now = new Date()

  // Mengambil data mulai awal bulan 11 bulan sebelumnya
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - 11,
    1
  )

  // Batas akhir adalah awal bulan berikutnya
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  )

  const payments = await prisma.payment.findMany({
    where: {
      transactionStatus: 'APPROVED',
      paidAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      amount: true,
      paidAt: true,
    },
  })

  const monthlyData = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - 11 + index,
      1
    )

    return {
      month: date.toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
      }),
      revenue: 0,
      year: date.getFullYear(),
      monthNumber: date.getMonth(),
    }
  })

  for (const payment of payments) {
    if (!payment.paidAt) continue

    const paymentDate = new Date(payment.paidAt)

    const targetMonth = monthlyData.find(
      (item) =>
        item.year === paymentDate.getFullYear() &&
        item.monthNumber === paymentDate.getMonth()
    )

    if (targetMonth) {
      targetMonth.revenue += Number(payment.amount)
    }
  }

  return monthlyData.map(({ month, revenue }) => ({
    month,
    revenue,
  }))
}

