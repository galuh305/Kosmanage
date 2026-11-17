
import { Hono } from 'hono'

import {
  registerController,
  loginController,
  activateTenantController,
  changePasswordController,
} from '../controllers/auth.controller'

import {
  authMiddleware,
  tenantMiddleware,
  type AuthEnv,
} from '../middleware/auth.middleware'

const authRoutes = new Hono<AuthEnv>()

// Registrasi akun tenant
authRoutes.post('/register', registerController)

// Login owner maupun tenant
authRoutes.post('/login', loginController)

// Aktivasi akun tenant
authRoutes.post('/activate', activateTenantController)

// Profil pengguna yang sedang login
authRoutes.get('/me', authMiddleware, (c) => {
  const user = c.get('authUser')

  return c.json({
    pesan: 'Berhasil mengambil profil pengguna',
    data: user,
  })
})

authRoutes.patch(
  '/change-password',
  authMiddleware,
  tenantMiddleware,
  changePasswordController
)

export default authRoutes
