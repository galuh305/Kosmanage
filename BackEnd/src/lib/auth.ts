
import { SignJWT, jwtVerify } from 'jose'

const secret = process.env.JWT_SECRET

if (!secret) {
  throw new Error('JWT_SECRET belum dikonfigurasi')
}

const secretKey = new TextEncoder().encode(secret)

export const generateToken = async (payload: {
  id: number
  email: string
  role: 'OWNER' | 'TENANT'
}) => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secretKey)
}

export const verifyToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    return payload
  } catch {
    return null
  }
}
