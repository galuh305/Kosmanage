
import { Hono } from 'hono'

import {
  getBookingsController,
  getBookingDetailController,
  createBookingController,
  updateBookingStatusController,
  regenerateActivationTokenController,
  cancelApprovedBookingController,
} from '../controllers/booking.controller'

import {
  authMiddleware,
  ownerMiddleware,
  type AuthEnv,
} from '../middleware/auth.middleware'

const bookingRoutes = new Hono<AuthEnv>()

// Pengunjung umum dapat mengajukan pemesanan
bookingRoutes.post('/', createBookingController)

// Khusus OWNER
bookingRoutes.get(
  '/',
  authMiddleware,
  ownerMiddleware,
  getBookingsController
)

bookingRoutes.get(
  '/:id',
  authMiddleware,
  ownerMiddleware,
  getBookingDetailController
)

bookingRoutes.patch(
  '/:id/status',
  authMiddleware,
  ownerMiddleware,
  updateBookingStatusController
)

// Buat token aktivasi baru (selama akun Tenant belum diaktivasi)
bookingRoutes.post(
  '/:id/activation-token',
  authMiddleware,
  ownerMiddleware,
  regenerateActivationTokenController
)

// Batalkan pemesanan yang sudah disetujui (kontrak & tagihan ikut dibatalkan,
// status kamar dikembalikan)
bookingRoutes.patch(
  '/:id/cancel',
  authMiddleware,
  ownerMiddleware,
  cancelApprovedBookingController
)

export default bookingRoutes
