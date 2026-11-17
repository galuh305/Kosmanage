import { prisma } from '../lib/prisma'
import { hash, compare } from 'bcryptjs'
import { randomBytes, createHash } from 'node:crypto'

type RegisterInput = {
  name: string
  email: string
  password: string
  phone?: string
}

export const registerUser = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  })

  if (existingUser) {
    throw new Error('EMAIL_ALREADY_EXISTS')
  }

  const hashedPassword = await hash(data.password, 12)

  return await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      role: 'TENANT',
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  })
}

export const loginUser = async (
  email: string,
  password: string
) => {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (
  !user ||
  !user.isActive ||
  (user.role === 'TENANT' && user.mustChangePassword)
) {
  throw new Error('INVALID_CREDENTIALS')
}

  const passwordValid = await compare(
    password,
    user.password
  )

  if (!passwordValid) {
    throw new Error('INVALID_CREDENTIALS')
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  }
}

export const generateActivationToken = () => {
  const token = randomBytes(32).toString('hex')

  const tokenHash = createHash('sha256')
    .update(token)
    .digest('hex')

  const expiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  )

  return {
    token,
    tokenHash,
    expiresAt,
  }
}

export const activateTenantAccount = async (
  token: string,
  newPassword: string
) => {
  const tokenHash = createHash('sha256')
    .update(token)
    .digest('hex')

  const user = await prisma.user.findUnique({
    where: {
      activationTokenHash: tokenHash,
    },
  })

  if (!user || user.role !== 'TENANT') {
    throw new Error('INVALID_ACTIVATION_TOKEN')
  }

  if (
    !user.activationExpiresAt ||
    user.activationExpiresAt <= new Date()
  ) {
    throw new Error('ACTIVATION_TOKEN_EXPIRED')
  }

  if (!user.mustChangePassword) {
    throw new Error('ACCOUNT_ALREADY_ACTIVATED')
  }

  const hashedPassword = await hash(newPassword, 12)

  return await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
      activationTokenHash: null,
      activationExpiresAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  })
}

export const changeTenantPassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  })

  if (!user || user.role !== 'TENANT' || !user.isActive) {
    throw new Error('USER_NOT_FOUND')
  }

  const passwordValid = await compare(
    currentPassword,
    user.password
  )

  if (!passwordValid) {
    throw new Error('INVALID_CURRENT_PASSWORD')
  }

  const hashedPassword = await hash(newPassword, 12)

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  })

  return true
}