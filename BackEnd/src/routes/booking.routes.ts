
import { Hono } from 'hono'

import {
  getBookingsController,
  getBookingDetailController,
  createBookingController,
  updateBookingStatusController,
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

export default bookingRoutes
