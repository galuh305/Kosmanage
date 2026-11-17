import { prisma } from '../lib/prisma'

type CreateRoomTypeInput = {
  name: string
  description?: string
  basePrice: number
}

export const getAllRoomTypes = async () => {
  return await prisma.roomType.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const createRoomType = async (data: CreateRoomTypeInput) => {
  return await prisma.roomType.create({
    data: {
      name: data.name,
      description: data.description,
      basePrice: data.basePrice,
    },
  })
}