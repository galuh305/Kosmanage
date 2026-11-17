
import { Hono } from 'hono'

import {
  getRoomsController,
  getRoomDetailController,
  createRoomController,
  updateRoomController,
  updateRoomStatusController,
  updateRoomFacilitiesController,
} from '../controllers/room.controller'

import {
  authMiddleware,
  ownerMiddleware,
  type AuthEnv,
} from '../middleware/auth.middleware'

const roomRoutes = new Hono<AuthEnv>()

// Endpoint publik
roomRoutes.get('/', getRoomsController)
roomRoutes.get('/:id', getRoomDetailController)

// Endpoint khusus OWNER
roomRoutes.post(
  '/',
  authMiddleware,
  ownerMiddleware,
  createRoomController
)

roomRoutes.patch(
  '/:id/status',
  authMiddleware,
  ownerMiddleware,
  updateRoomStatusController
)

roomRoutes.put(
  '/:id/facilities',
  authMiddleware,
  ownerMiddleware,
  updateRoomFacilitiesController
)

roomRoutes.patch(
  '/:id',
  authMiddleware,
  ownerMiddleware,
  updateRoomController
)

export default roomRoutes
