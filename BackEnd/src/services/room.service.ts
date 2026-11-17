import { prisma } from '../lib/prisma'

export const getAllRooms = async () => {
  return await prisma.room.findMany({
    include: {
      roomType: true,
      facilities: {
        include: {
          facility: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}
export const getRoomById = async (id: number) => {
  return await prisma.room.findUnique({
    where: {
      id,
    },
    include: {
      roomType: true,
      facilities: {
        include: {
          facility: true,
        },
      },
    },
  })
}


type CreateRoomInput = {
  roomNumber: string
  name: string
  description?: string
  price?: number
  roomTypeId: number
  facilityIds?: number[]
  imageUrl?: string
}

export const createRoom = async (data: CreateRoomInput) => {
  return await prisma.room.create({
    data: {
      roomNumber: data.roomNumber,
      name: data.name,
      description: data.description,
      price: data.price,
      roomTypeId: data.roomTypeId,
      imageUrl: data.imageUrl,

      facilities: {
        create: (data.facilityIds ?? []).map((facilityId) => ({
          facility: {
            connect: {
              id: facilityId,
            },
          },
        })),
      },
    },
    include: {
      roomType: true,
      facilities: {
        include: {
          facility: true,
        },
      },
    },
  })
}


type UpdateRoomInput = {
  roomNumber?: string
  name?: string
  description?: string
  price?: number
  roomTypeId?: number
  imageUrl?: string
}


export const updateRoom = async (id: number, data: UpdateRoomInput) => {
  return await prisma.room.update({
    where: { id },
    data: {
      roomNumber: data.roomNumber,
      name: data.name,
      description: data.description,
      price: data.price,
      roomTypeId: data.roomTypeId,
      imageUrl: data.imageUrl,
    },
    include: {
      roomType: true,
      facilities: {
        include: {
          facility: true,
        },
      },
    },
  })
}

type UpdateRoomStatusInput = {
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
}

export const updateRoomStatus = async (
  id: number,
  data: UpdateRoomStatusInput
) => {
  return await prisma.room.update({
    where: { id },
    data: {
      status: data.status,
    },
    include: {
      roomType: true,
    },
  })
}

export const updateRoomFacilities = async (
  roomId: number,
  facilityIds: number[]
) => {
  return await prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      facilities: {
        deleteMany: {},
        create: facilityIds.map((facilityId) => ({
          facility: {
            connect: {
              id: facilityId,
            },
          },
        })),
      },
    },
    include: {
      roomType: true,
      facilities: {
        include: {
          facility: true,
        },
      },
    },
  })
}