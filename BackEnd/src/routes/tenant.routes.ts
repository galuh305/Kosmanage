
import { Hono } from 'hono'

import {
  getTenantDashboard,
  getTenantInvoices,
} from '../controllers/tenant.controller'

import {
  authMiddleware,
  tenantMiddleware,
  type AuthEnv,
} from '../middleware/auth.middleware'

const tenantRoutes = new Hono<AuthEnv>()

// Semua endpoint membutuhkan autentikasi Tenant
tenantRoutes.use('*', authMiddleware)
tenantRoutes.use('*', tenantMiddleware)

// Mengambil data dashboard Tenant
tenantRoutes.get('/dashboard', getTenantDashboard)

// Mengambil data dashboard Tenant
tenantRoutes.get('/dashboard', getTenantDashboard)

// Mengambil daftar tagihan Tenant
tenantRoutes.get('/invoices', getTenantInvoices)

export default tenantRoutes
