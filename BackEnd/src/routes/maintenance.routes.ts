
import { Hono } from 'hono'
import type { AuthEnv } from '../middleware/auth.middleware'

import { authMiddleware } from '../middleware/auth.middleware'
import {
  ownerMiddleware,
  tenantMiddleware,
} from '../middleware/auth.middleware'

import {
  createMaintenanceController,
  getTenantMaintenanceController,
  getAllMaintenanceController,
  updateMaintenanceStatusController,
} from '../controllers/maintenance.controller'

const maintenanceRoutes = new Hono<AuthEnv>()

// Tenant
maintenanceRoutes.post(
  '/',
  authMiddleware,
  tenantMiddleware,
  createMaintenanceController
)

maintenanceRoutes.get(
  '/tenant',
  authMiddleware,
  tenantMiddleware,
  getTenantMaintenanceController
)

// Owner
maintenanceRoutes.get(
  '/',
  authMiddleware,
  ownerMiddleware,
  getAllMaintenanceController
)

maintenanceRoutes.patch(
  '/:id/status',
  authMiddleware,
  ownerMiddleware,
  updateMaintenanceStatusController
)

export default maintenanceRoutes
