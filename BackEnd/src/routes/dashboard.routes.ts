
import { Hono } from 'hono'

import { getDashboardSummaryController } from '../controllers/dashboard.controller'

import {
  authMiddleware,
  ownerMiddleware,
  type AuthEnv,
} from '../middleware/auth.middleware'

const dashboardRoutes = new Hono<AuthEnv>()

// Dashboard hanya dapat diakses OWNER
dashboardRoutes.get(
  '/',
  authMiddleware,
  ownerMiddleware,
  getDashboardSummaryController
)

export default dashboardRoutes
