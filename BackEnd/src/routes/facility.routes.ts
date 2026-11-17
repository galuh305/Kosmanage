
import { Hono } from 'hono'

import {
  getFacilitiesController,
  createFacilityController,
} from '../controllers/facility.controller'

import {
  authMiddleware,
  ownerMiddleware,
  type AuthEnv,
} from '../middleware/auth.middleware'

const facilityRoutes = new Hono<AuthEnv>()

// Endpoint publik
facilityRoutes.get('/', getFacilitiesController)

// Endpoint khusus OWNER
facilityRoutes.post(
  '/',
  authMiddleware,
  ownerMiddleware,
  createFacilityController
)

export default facilityRoutes
