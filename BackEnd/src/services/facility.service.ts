import { prisma } from '../lib/prisma'

type CreateFacilityInput = {
  name: string
}

export const getAllFacilities = async () => {
  return await prisma.facility.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const createFacility = async (data: CreateFacilityInput) => {
  return await prisma.facility.create({
    data: {
      name: data.name,
    },
  })
}