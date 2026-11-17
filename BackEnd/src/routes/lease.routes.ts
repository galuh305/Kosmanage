import { Hono } from 'hono'

import {
  approveExtensionController,
  approveTerminationController,
  cancelExtensionController,
  cancelTerminationController,
  getLeaseRequestsController,
  rejectExtensionController,
  rejectTerminationController,
  requestExtensionController,
  requestTerminationController,
} from '../controllers/lease.controller'

import {
  authMiddleware,
  ownerMiddleware,
  tenantMiddleware,
  type AuthEnv,
} from '../middleware/auth.middleware'

const leaseRoutes = new Hono<AuthEnv>()

leaseRoutes.use('*', authMiddleware)

/* ------------------------------ Tenant ------------------------------ */

// Mengajukan perpanjangan sewa
leaseRoutes.post(
  '/:leaseId/extensions',
  tenantMiddleware,
  requestExtensionController
)

// Mengajukan pindah / berhenti sewa lebih awal
leaseRoutes.post(
  '/:leaseId/terminations',
  tenantMiddleware,
  requestTerminationController
)

// Membatalkan pengajuan sendiri
leaseRoutes.patch(
  '/extensions/:id/cancel',
  tenantMiddleware,
  cancelExtensionController
)

leaseRoutes.patch(
  '/terminations/:id/cancel',
  tenantMiddleware,
  cancelTerminationController
)

/* ------------------------------- Owner ------------------------------ */

// Daftar seluruh pengajuan perpanjangan & pindah
leaseRoutes.get('/requests', ownerMiddleware, getLeaseRequestsController)

leaseRoutes.patch(
  '/extensions/:id/approve',
  ownerMiddleware,
  approveExtensionController
)

leaseRoutes.patch(
  '/extensions/:id/reject',
  ownerMiddleware,
  rejectExtensionController
)

leaseRoutes.patch(
  '/terminations/:id/approve',
  ownerMiddleware,
  approveTerminationController
)

leaseRoutes.patch(
  '/terminations/:id/reject',
  ownerMiddleware,
  rejectTerminationController
)

export default leaseRoutes
