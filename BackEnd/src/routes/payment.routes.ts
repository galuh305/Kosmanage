
import { Hono } from 'hono'

import {
  createPaymentController,
  approvePaymentController,
  rejectPaymentController,
  getAllPaymentsController, 
  getPaymentProofController,
} from '../controllers/payment.controller'

import {
  authMiddleware,
  tenantMiddleware,
  ownerMiddleware,
  type AuthEnv,
} from '../middleware/auth.middleware'

const paymentRoutes = new Hono<AuthEnv>()

// Owner melihat seluruh pembayaran
paymentRoutes.get(
  '/',
  authMiddleware,
  ownerMiddleware,
  getAllPaymentsController
)

// Owner melihat bukti transfer
paymentRoutes.get(
  '/:id/proof',
  authMiddleware,
  ownerMiddleware,
  getPaymentProofController
)

// Tenant mengajukan pembayaran
paymentRoutes.post(
  '/',
  authMiddleware,
  tenantMiddleware,
  createPaymentController
)

// Owner menyetujui pembayaran
paymentRoutes.patch(
  '/:id/approve',
  authMiddleware,
  ownerMiddleware,
  approvePaymentController
)

// Owner menolak pembayaran
paymentRoutes.patch(
  '/:id/reject',
  authMiddleware,
  ownerMiddleware,
  rejectPaymentController
)

export default paymentRoutes
