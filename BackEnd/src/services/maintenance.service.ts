
import { prisma } from '../lib/prisma'

type CreateMaintenanceInput = {
  leaseId: number
  roomId: number
  userId: number
  title: string
  description: string
  photoUrl?: string
}

export const createMaintenanceRequest = async ({
  leaseId,
  roomId,
  userId,
  title,
  description,
  photoUrl,
}: CreateMaintenanceInput) => {
  const lease = await prisma.lease.findFirst({
    where: {
      id: leaseId,
      userId,
      roomId,
      status: 'ACTIVE',
    },
  })

  if (!lease) {
    throw new Error('ACTIVE_LEASE_NOT_FOUND')
  }

  return await prisma.maintenanceRequest.create({
    data: {
      leaseId,
      roomId,
      title,
      description,
      photoUrl,
      status: 'PENDING',
    },
  })
}

export const getTenantMaintenanceRequests = async (userId: number) => {
  return await prisma.maintenanceRequest.findMany({
    where: {
      lease: {
        is: {
          userId,
        },
      },
    },
    include: {
      room: true,
      lease: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const getAllMaintenanceRequests = async () => {
  return await prisma.maintenanceRequest.findMany({
    include: {
      room: true,
      lease: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const updateMaintenanceStatus = async (
  id: number,
  status: 'PROCESSING' | 'COMPLETED' | 'REJECTED',
  ownerNote?: string
) => {
  const maintenance = await prisma.maintenanceRequest.findUnique({
    where: { id },
  })

  if (!maintenance) {
    throw new Error('MAINTENANCE_NOT_FOUND')
  }

  return await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status,
      ownerNote,
    },
  })
}
