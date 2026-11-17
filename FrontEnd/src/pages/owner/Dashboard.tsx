
import { useEffect, useState } from 'react'

import {
  DoorOpen,
  ClipboardList,
  CreditCard,
  UserRound,
} from 'lucide-react'

import {
  getDashboard,
  type DashboardData,
} from '../../services/dashboard.service'

function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getDashboard()
        setDashboardData(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Gagal mengambil data dashboard',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <section className="p-5 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Selamat datang, Owner
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Berikut ringkasan aktivitas pengelolaan KosManage.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">Memuat data dashboard...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-700">
            Gagal memuat dashboard
          </p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      ) : dashboardData ? (
        <>
          {/* Statistik utama */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Total Kamar</p>
                <DoorOpen className="text-blue-500" size={22} />
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-800">
                {dashboardData.rooms.total}
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                {dashboardData.rooms.available} kamar tersedia
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Kamar Terisi</p>
                <UserRound className="text-emerald-500" size={22} />
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-800">
                {dashboardData.rooms.occupied}
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                {dashboardData.rooms.reserved} kamar sudah dipesan
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Pemesanan</p>
                <ClipboardList className="text-amber-500" size={22} />
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-800">
                {dashboardData.bookings.total}
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                {dashboardData.bookings.pending} menunggu persetujuan
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Total Pendapatan</p>
                <CreditCard className="text-violet-500" size={22} />
              </div>
              <h3 className="mt-4 text-2xl font-bold text-slate-800">
                {formatRupiah(dashboardData.payments.totalRevenue)}
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                {dashboardData.payments.successfulTransactions} transaksi berhasil
              </p>
            </div>
          </div>

          {/* Grafik pendapatan */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-800">
                  Pendapatan Bulanan
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Statistik pendapatan selama 12 bulan terakhir
                </p>
              </div>

              <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600">
                12 Bulan Terakhir
              </span>
            </div>

            <div className="mt-8 flex h-64 items-end gap-2 overflow-x-auto pb-2 sm:gap-4">
              {(() => {
                const maxRevenue = Math.max(
                  ...dashboardData.monthlyRevenue.map(
                    (item) => item.revenue,
                  ),
                  1,
                )

                return dashboardData.monthlyRevenue.map((item, index) => {
                  const height =
                    item.revenue === 0
                      ? 3
                      : Math.max((item.revenue / maxRevenue) * 100, 5)

                  return (
                    <div
                      key={`${item.month}-${index}`}
                      className="flex min-w-8 flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div className="group relative flex h-52 w-full items-end justify-center">
                        <div
                          className="w-full max-w-12 rounded-t-md bg-blue-500 transition-all duration-300 hover:bg-blue-700"
                          style={{ height: `${height}%` }}
                          title={`${item.month}: ${formatRupiah(item.revenue)}`}
                        />
                      </div>

                      <span className="whitespace-nowrap text-[10px] text-slate-400 sm:text-xs">
                        {item.month.split(' ')[0]}
                      </span>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          {/* Ringkasan */}
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800">
                Ringkasan Pembayaran
              </h3>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Berhasil</span>
                  <span className="font-semibold text-emerald-600">
                    {dashboardData.payments.successfulTransactions}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Menunggu Verifikasi</span>
                  <span className="font-semibold text-amber-600">
                    {dashboardData.payments.pendingTransactions}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ditolak</span>
                  <span className="font-semibold text-red-600">
                    {dashboardData.payments.failedTransactions}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800">
                Ringkasan Kamar
              </h3>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tersedia</span>
                  <span className="font-semibold text-blue-600">
                    {dashboardData.rooms.available}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Terisi</span>
                  <span className="font-semibold text-emerald-600">
                    {dashboardData.rooms.occupied}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Dipesan</span>
                  <span className="font-semibold text-violet-600">
                    {dashboardData.rooms.reserved}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Perbaikan</span>
                  <span className="font-semibold text-amber-600">
                    {dashboardData.rooms.maintenance}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}

export default Dashboard
