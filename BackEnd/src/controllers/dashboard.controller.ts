
import type { Context } from 'hono'

import {
  getDashboardSummary,
  getPaymentStatistics,
  getMonthlyRevenue,
} from '../services/dashboard.service'

export const getDashboardSummaryController = async (c: Context) => {
  try {
    const [
      summary,
      paymentStatistics,
      monthlyRevenue,
    ] = await Promise.all([
      getDashboardSummary(),
      getPaymentStatistics(),
      getMonthlyRevenue(),
    ])

    return c.json({
      pesan: 'Berhasil mengambil ringkasan dashboard',
      data: {
        ...summary,
        payments: paymentStatistics,
        monthlyRevenue,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)

    return c.json(
      {
        pesan: 'Gagal mengambil ringkasan dashboard',
      },
      500
    )
  }
}
