
import { createMiddleware } from 'hono/factory'
import { verifyToken } from '../lib/auth'

export type AuthUser = {
  id: number
  email: string
  role: 'OWNER' | 'TENANT'
}

export type AuthEnv = {
  Variables: {
    authUser: AuthUser
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(
  async (c, next) => {
    const authorization = c.req.header('Authorization')

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return c.json({
        pesan: 'Token autentikasi tidak ditemukan',
      }, 401)
    }

    const token = authorization.slice(7)
    const payload = await verifyToken(token)

    if (
      !payload ||
      typeof payload.id !== 'number' ||
      typeof payload.email !== 'string' ||
      !['OWNER', 'TENANT'].includes(String(payload.role))
    ) {
      return c.json({
        pesan: 'Token tidak valid atau sudah kedaluwarsa',
      }, 401)
    }

    c.set('authUser', {
      id: payload.id,
      email: payload.email,
      role: payload.role as 'OWNER' | 'TENANT',
    })

    await next()
  }
)

export const ownerMiddleware = createMiddleware<AuthEnv>(
  async (c, next) => {
    const user = c.get('authUser')

    if (user.role !== 'OWNER') {
      return c.json({
        pesan: 'Akses ditolak. Khusus owner.',
      }, 403)
    }

    await next()
  }
)

export const tenantMiddleware = createMiddleware<AuthEnv>(
  async (c, next) => {
    const user = c.get('authUser')

    if (user.role !== 'TENANT') {
      return c.json({
        pesan: 'Akses ditolak. Khusus tenant.',
      }, 403)
    }

    await next()
  }
)
