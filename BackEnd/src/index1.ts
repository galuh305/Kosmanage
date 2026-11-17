
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import 'dotenv/config'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import roomRoutes from './routes/room.routes'
import roomTypeRoutes from './routes/roomType.routes'
import facilityRoutes from './routes/facility.routes'
import bookingRoutes from './routes/booking.routes'
import authRoutes from './routes/auth.routes'
import dashboardRoutes from './routes/dashboard.routes'
import tenantRoutes from './routes/tenant.routes'
import { syncRoomStatuses } from './services/room-status.service'
import paymentRoutes from './routes/payment.routes'
import maintenanceRoutes from './routes/maintenance.routes'

const app = new Hono()

app.use(
  '/uploads/*',
  serveStatic({ root: './' })
)

app.use(
  '*',
  cors({
    origin: 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

app.get('/', (c) => {
  return c.json({
    pesan: 'Backend KosManage berhasil dijalankan!',
    status: 'success',
  })
})

app.get('/api', (c) => {
  return c.json({
    aplikasi: 'KosManage',
    versi: '1.0.0',
    deskripsi: 'API Sistem Manajemen Rumah Kos',
  })
})

app.route('/api/rooms', roomRoutes)
app.route('/api/room-types', roomTypeRoutes)
app.route('/api/facilities', facilityRoutes)
app.route('/api/bookings', bookingRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/tenant', tenantRoutes)
app.route('/api/payments', paymentRoutes)
app.route('/api/maintenance', maintenanceRoutes)
const port = 3000

// Sinkronisasi status kamar otomatis
let isSyncingRoomStatus = false

const runRoomStatusSync = async () => {
  if (isSyncingRoomStatus) return

  isSyncingRoomStatus = true

  try {
    await syncRoomStatuses()
    console.log('[Room Status] Sinkronisasi berhasil')
  } catch (error) {
    console.error('[Room Status] Sinkronisasi gagal:', error)
  } finally {
    isSyncingRoomStatus = false
  }
}

// Sinkronisasi pertama ketika server dijalankan
void runRoomStatusSync()

// Sinkronisasi setiap 60 detik
setInterval(() => {
  void runRoomStatusSync()
}, 60 * 1000)

serve({
  fetch: app.fetch,
  port,
})

console.log(`Server KosManage berjalan di http://localhost:${port}`)
