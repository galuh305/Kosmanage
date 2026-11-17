
import { Hono } from 'hono'

import {
  getRoomTypesController,
  createRoomTypeController,
} from '../controllers/roomType.controller'

import {
  authMiddleware,
  ownerMiddleware,
  type AuthEnv,
} from '../middleware/auth.middleware'

const roomTypeRoutes = new Hono<AuthEnv>()

// Endpoint publik
roomTypeRoutes.get('/', getRoomTypesController)

// Endpoint khusus OWNER
roomTypeRoutes.post(
  '/',
  authMiddleware,
  ownerMiddleware,
  createRoomTypeController
)

export default roomTypeRoutes
