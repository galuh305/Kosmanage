
import type { Context } from 'hono'
import { prisma } from '../lib/prisma'

export const getTenantDashboard = async (c: Context) => {
  try {
    const user = c.get('authUser')

    const tenant = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        leases: {
          include: {
            room: {
              include: {
                roomType: true,
              },
            },
            booking: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!tenant) {
      return c.json({
        pesan: 'Data Tenant tidak ditemukan',
      }, 404)
    }

    return c.json({
      pesan: 'Berhasil mengambil dashboard Tenant',
      data: tenant,
    })
  } catch (error) {
    console.error('Get tenant dashboard error:', error)

    return c.json({
      pesan: 'Gagal mengambil dashboard Tenant',
    }, 500)
  }
}


export const getTenantInvoices = async (c: Context) => {
  try {
    const user = c.get('authUser')

    const invoices = await prisma.invoice.findMany({
      where: {
        lease: {
          is: {
            userId: user.id,
          },
        },
      },
      include: {
        lease: {
          include: {
            room: {
              include: {
                roomType: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    })

    return c.json({
      pesan: 'Berhasil mengambil tagihan Tenant',
      data: invoices,
    })
  } catch (error) {
    console.error('Get tenant invoices error:', error)

    return c.json({
      pesan: 'Gagal mengambil tagihan Tenant',
    }, 500)
  }
}

