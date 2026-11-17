import API_URL from "../config/api";

export type TenantInvoice = {
  id: number
  invoiceNumber: string
  amount: number | string
  dueDate: string
  paidAt: string | null
  status: 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  description: string | null
  createdAt: string
  lease: {
    id: number
    startDate: string
    endDate: string
    monthlyPrice: number | string
    room: {
      id: number
      roomNumber: string
      name: string
      roomType: {
        id: number
        name: string
      }
    }
  }
  payments: {
    id: number
    orderId: string
    amount: number | string
    paymentMethod: string | null
    transactionStatus: string
    paidAt: string | null
  }[]
}

type InvoiceResponse = {
  pesan: string
  data?: TenantInvoice[]
}

export const getTenantInvoices = async (): Promise<TenantInvoice[]> => {
  const token = localStorage.getItem('kosmanage_token')

  if (!token) {
    throw new Error('Token tidak ditemukan. Silakan login kembali.')
  }

  const response = await fetch(`${API_URL}/tenant/invoices`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const result = await response.json() as InvoiceResponse

  if (!response.ok || !result.data) {
    throw new Error(result.pesan || 'Gagal mengambil daftar tagihan')
  }

  return result.data
}
