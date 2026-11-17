// Helper tanggal untuk fitur perpanjangan & pemutusan sewa.
// Semua perhitungan memakai UTC supaya konsisten dengan pembuatan tagihan
// di booking.service.ts.

const DAY_MS = 24 * 60 * 60 * 1000

// Tenant baru boleh mengajukan perpanjangan mulai N hari sebelum sewa berakhir
export const LEASE_EXTENSION_WINDOW_DAYS = 30

// Setelah sewa berakhir, tenant masih punya N hari untuk memperpanjang
// sebelum kontrak otomatis ditandai COMPLETED
export const LEASE_EXTENSION_GRACE_DAYS = 7

export const MAX_EXTENSION_MONTHS = 12

// Batas hari jatuh tempo tagihan perpanjangan sejak disetujui owner
export const EXTENSION_INVOICE_DUE_DAYS = 3

export const startOfUTCDay = (date: Date) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  )

export const addDaysUTC = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS)

// Tambah bulan tanpa "meluber" ke bulan berikutnya.
// Contoh: 31 Jan + 1 bulan = 28/29 Feb (bukan 3 Mar).
export const addMonthsUTC = (date: Date, months: number) => {
  const day = date.getUTCDate()

  const result = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + months,
      1,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  )

  const lastDayOfTargetMonth = new Date(
    Date.UTC(
      result.getUTCFullYear(),
      result.getUTCMonth() + 1,
      0
    )
  ).getUTCDate()

  result.setUTCDate(Math.min(day, lastDayOfTargetMonth))

  return result
}

// Menerima string "YYYY-MM-DD" (atau ISO) dan mengembalikan awal hari UTC.
// Mengembalikan null jika formatnya tidak valid.
export const parseDateOnly = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()

  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return null

  const parsed = new Date(trimmed.slice(0, 10) + 'T00:00:00.000Z')

  if (Number.isNaN(parsed.getTime())) return null

  // Tolak tanggal yang "dibetulkan" otomatis, misalnya 2026-02-31
  if (parsed.toISOString().slice(0, 10) !== trimmed.slice(0, 10)) {
    return null
  }

  return parsed
}

// Apakah tenant sedang berada di jendela waktu yang boleh memperpanjang?
export const isWithinExtensionWindow = (
  leaseEndDate: Date,
  now: Date = new Date()
) => {
  const windowStart = addDaysUTC(
    leaseEndDate,
    -LEASE_EXTENSION_WINDOW_DAYS
  )

  const windowEnd = addDaysUTC(
    leaseEndDate,
    LEASE_EXTENSION_GRACE_DAYS
  )

  return now >= windowStart && now <= windowEnd
}
