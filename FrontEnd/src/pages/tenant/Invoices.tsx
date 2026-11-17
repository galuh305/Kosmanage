
import { useEffect, useState } from 'react'
import {
  ReceiptText,
  CalendarDays,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'

import {
  getTenantInvoices,
  type TenantInvoice,
} from '../../services/invoice.service'

function Invoices() {
  const [invoices, setInvoices] = useState<TenantInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await getTenantInvoices()
        setInvoices(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal mengambil daftar tagihan',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  const formatRupiah = (amount: number | string) => {
    return Number(amount).toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const statusConfig = {
    UNPAID: {
      label: 'Belum Dibayar',
      style: 'bg-yellow-100 text-yellow-700',
      icon: Clock,
    },
    PAID: {
      label: 'Lunas',
      style: 'bg-green-100 text-green-700',
      icon: CheckCircle2,
    },
    OVERDUE: {
      label: 'Terlambat',
      style: 'bg-red-100 text-red-700',
      icon: AlertCircle,
    },
    CANCELLED: {
      label: 'Dibatalkan',
      style: 'bg-slate-100 text-slate-600',
      icon: AlertCircle,
    },
  }

  const totalUnpaid = invoices
    .filter((invoice) =>
      ['UNPAID', 'OVERDUE'].includes(invoice.status),
    )
    .reduce((total, invoice) => total + Number(invoice.amount), 0)

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Memuat data tagihan...
      </div>
    )
  }

  if (error) {
    return (
      <div className="m-6 rounded-lg bg-red-50 p-4 text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Tagihan Saya
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Lihat daftar tagihan dan status pembayaran sewa kamar Anda.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                <ReceiptText size={22} />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Total Tagihan
              </p>
            </div>

            <h2 className="mt-4 text-2xl font-bold text-slate-800">
              {invoices.length}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-3 text-red-600">
                <Wallet size={22} />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Total Belum Dibayar
              </p>
            </div>

            <h2 className="mt-4 text-2xl font-bold text-red-600">
              {formatRupiah(totalUnpaid)}
            </h2>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800">
              Riwayat Tagihan
            </h2>
          </div>

          {invoices.length === 0 ? (
            <div className="p-10 text-center">
              <ReceiptText
                size={42}
                className="mx-auto text-slate-300"
              />
              <p className="mt-4 font-semibold text-slate-700">
                Belum Ada Tagihan
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Tagihan sewa Anda akan muncul di halaman ini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {invoices.map((invoice) => {
                const status = statusConfig[invoice.status]
                const StatusIcon = status.icon

                return (
                  <div
                    key={invoice.id}
                    className="p-6 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-bold text-slate-800">
                            {invoice.invoiceNumber}
                          </h3>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${status.style}`}
                          >
                            <StatusIcon size={14} />
                            {status.label}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          Kamar {invoice.lease.room.roomNumber} -{' '}
                          {invoice.lease.room.name}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-2">
                            <CalendarDays size={16} />
                            Jatuh tempo: {formatDate(invoice.dueDate)}
                          </span>

                          {invoice.paidAt && (
                            <span className="flex items-center gap-2">
                              <CheckCircle2 size={16} />
                              Dibayar: {formatDate(invoice.paidAt)}
                            </span>
                          )}
                        </div>

                        {invoice.description && (
                          <p className="mt-2 text-sm text-slate-500">
                            {invoice.description}
                          </p>
                        )}
                      </div>

                      <div className="md:text-right">
                        <p className="text-xs text-slate-500">
                          Nominal Tagihan
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-800">
                          {formatRupiah(invoice.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Invoices
