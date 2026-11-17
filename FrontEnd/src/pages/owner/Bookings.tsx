import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardList,
  RefreshCw,
  Search,
  CalendarDays,
  UserRound,
  Eye,
  KeyRound,
} from "lucide-react";

import {
  getBookings,
  updateBookingStatus,
  regenerateActivationToken,
  cancelApprovedBooking,
  type Booking,
  type BookingStatus,
} from "../../services/booking.service";

// Salin teks ke clipboard. navigator.clipboard hanya tersedia di koneksi aman
// (HTTPS / localhost), jadi disediakan cadangan lewat document.execCommand
// agar tetap berfungsi saat aplikasi dibuka lewat HTTP / alamat IP jaringan.
const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // lanjut ke metode cadangan
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);

    return success;
  } catch {
    return false;
  }
};

function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activationToken, setActivationToken] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [tokenExpiresAt, setTokenExpiresAt] = useState("");
  const [tokenRegenerated, setTokenRegenerated] = useState(false);
  const tokenInputRef = useRef<HTMLInputElement>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil data pemesanan",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking) return;

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menolak pemesanan dari ${selectedBooking.guestName}?`,
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      await updateBookingStatus(selectedBooking.id, "REJECTED");

      setSelectedBooking(null);

      await fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menolak pemesanan");
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedBooking) return;

    if (!selectedBooking.endDate) {
      alert(
        "Pemesanan tidak dapat disetujui karena tanggal selesai sewa belum diisi.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menyetujui pemesanan dari ${selectedBooking.guestName}?`,
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      const result = await updateBookingStatus(selectedBooking.id, "APPROVED");

      setSelectedBooking(null);

      await fetchBookings();

      if (result.activationToken) {
        setTokenRegenerated(false);
        setTokenExpiresAt("");
        setActivationToken(result.activationToken);
        setCopySuccess(false);
      } else {
        alert(result.pesan);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui pemesanan");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelApproved = async () => {
    if (!selectedBooking) return;

    const hasStarted =
      !!selectedBooking.startDate &&
      new Date(selectedBooking.startDate).getTime() <= Date.now();

    const confirmed = window.confirm(
      `Batalkan pemesanan ${selectedBooking.guestName} untuk kamar ${selectedBooking.room.roomNumber}?\n\n` +
        `- Kontrak sewa dibatalkan dan tagihan yang belum dibayar ikut dibatalkan.\n` +
        `- Status kamar diperbarui sehingga bisa dipesan kembali.\n` +
        (hasStarted
          ? `\nPERHATIAN: tanggal mulai sewa sudah lewat. Pastikan tenant memang tidak menempati kamar ini.\n`
          : "") +
        `\nTindakan ini tidak dapat dibatalkan.`,
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      const result = await cancelApprovedBooking(selectedBooking.id);

      setSelectedBooking(null);

      await fetchBookings();

      alert(result.pesan);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal membatalkan pemesanan");
    } finally {
      setProcessing(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!selectedBooking) return;

    const confirmed = window.confirm(
      `Buat token aktivasi baru untuk ${selectedBooking.guestName}? Token sebelumnya tidak akan berlaku lagi.`,
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      const result = await regenerateActivationToken(selectedBooking.id);

      setSelectedBooking(null);

      setTokenRegenerated(true);
      setTokenExpiresAt(result.expiresAt);
      setActivationToken(result.activationToken);
      setCopySuccess(false);

      await fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal membuat token aktivasi");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        booking.guestName.toLowerCase().includes(keyword) ||
        booking.guestEmail.toLowerCase().includes(keyword) ||
        booking.guestPhone.includes(keyword) ||
        booking.room.roomNumber.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  const formatDate = (date: string | null) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
  };

  const formatPrice = (price: number | string | null) => {
    if (price === null) return "-";

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  // Status aktivasi akun Tenant (hanya relevan untuk pemesanan yang disetujui)
  type ActivationState = "ACTIVATED" | "WAITING" | "EXPIRED";

  const getActivationState = (booking: Booking): ActivationState | null => {
    if (booking.status !== "APPROVED" || !booking.user) return null;

    if (!booking.user.mustChangePassword) return "ACTIVATED";

    const expiresAt = booking.user.activationExpiresAt
      ? new Date(booking.user.activationExpiresAt).getTime()
      : 0;

    return expiresAt > Date.now() ? "WAITING" : "EXPIRED";
  };

  const activationHint: Record<ActivationState, { text: string; className: string }> = {
    WAITING: { text: "Belum aktivasi", className: "text-amber-600" },
    EXPIRED: { text: "Token kedaluwarsa", className: "text-red-600" },
    ACTIVATED: { text: "Akun aktif", className: "text-green-600" },
  };

  const selectedActivation = selectedBooking
    ? getActivationState(selectedBooking)
    : null;

  const statusLabel: Record<BookingStatus, string> = {
    PENDING: "Menunggu",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    CANCELLED: "Dibatalkan",
  };

  const statusStyle: Record<BookingStatus, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-slate-100 text-slate-600",
  };

  const pendingCount = bookings.filter(
    (booking) => booking.status === "PENDING",
  ).length;

  const approvedCount = bookings.filter(
    (booking) => booking.status === "APPROVED",
  ).length;

  const rejectedCount = bookings.filter(
    (booking) => booking.status === "REJECTED",
  ).length;

  return (
    <section className="p-5 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Manajemen Pemesanan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola dan pantau pengajuan sewa kamar dari calon penyewa.
        </p>
      </div>

      {/* Statistik */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Pemesanan</p>
            <ClipboardList className="text-blue-600" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">
            {bookings.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Menunggu</p>
          <p className="mt-3 text-2xl font-bold text-amber-600">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Disetujui</p>
          <p className="mt-3 text-2xl font-bold text-green-600">
            {approvedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Ditolak</p>
          <p className="mt-3 text-2xl font-bold text-red-600">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* Daftar pemesanan */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Daftar Pemesanan</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredBookings.length} pemesanan ditemukan
            </p>
          </div>

          <button
            onClick={fetchBookings}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Muat Ulang
          </button>
        </div>

        {/* Pencarian dan filter */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, nomor telepon, atau kamar..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Memuat data pemesanan...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchBookings}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <UserRound className="mx-auto text-slate-300" size={36} />
            <p className="mt-3 font-medium text-slate-700">
              Tidak ada pemesanan ditemukan
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Coba ubah kata kunci atau filter status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Calon Penyewa</th>
                  <th className="px-5 py-4 font-semibold">Kamar</th>
                  <th className="px-5 py-4 font-semibold">Harga</th>
                  <th className="px-5 py-4 font-semibold">Periode Sewa</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-center font-semibold">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {booking.guestName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {booking.guestEmail}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {booking.guestPhone}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        Kamar {booking.room.roomNumber}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {booking.room.roomType.name}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {formatPrice(booking.room.price)}
                      <p className="mt-1 text-xs font-normal text-slate-400">
                        per bulan
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <CalendarDays size={15} />
                        <span>{formatDate(booking.startDate)}</span>
                      </div>
                      <p className="mt-1 pl-6 text-xs text-slate-400">
                        s.d. {formatDate(booking.endDate)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle[booking.status]}`}
                      >
                        {statusLabel[booking.status]}
                      </span>

                      {(() => {
                        const state = getActivationState(booking);

                        return state ? (
                          <p
                            className={`mt-1.5 text-xs font-medium ${activationHint[state].className}`}
                          >
                            {activationHint[state].text}
                          </p>
                        ) : null;
                      })()}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                      >
                        <Eye size={15} />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal Detail Pemesanan */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Detail Pemesanan
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Informasi lengkap pengajuan sewa kamar
                </p>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-5">
              {/* Informasi Penyewa */}
              <div>
                <h3 className="mb-3 font-semibold text-slate-800">
                  Informasi Calon Penyewa
                </h3>

                <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Nama</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {selectedBooking.guestName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="mt-1 break-all font-medium text-slate-800">
                      {selectedBooking.guestEmail}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Nomor Telepon</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {selectedBooking.guestPhone}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Tanggal Pengajuan</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatDate(selectedBooking.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informasi Kamar */}
              <div>
                <h3 className="mb-3 font-semibold text-slate-800">
                  Informasi Kamar
                </h3>

                <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Nomor Kamar</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {selectedBooking.room.roomNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Nama Kamar</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {selectedBooking.room.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Tipe Kamar</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {selectedBooking.room.roomType.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Harga per Bulan</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatPrice(selectedBooking.room.price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Periode Sewa */}
              <div>
                <h3 className="mb-3 font-semibold text-slate-800">
                  Periode Sewa
                </h3>

                <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-xs text-slate-500">Tanggal Mulai</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatDate(selectedBooking.startDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Tanggal Selesai</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatDate(selectedBooking.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pesan */}
              <div>
                <h3 className="mb-3 font-semibold text-slate-800">
                  Pesan dari Calon Penyewa
                </h3>

                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  {selectedBooking.message || "Tidak ada pesan."}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="mb-2 text-xs text-slate-500">Status Pemesanan</p>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${statusStyle[selectedBooking.status]}`}
                >
                  {statusLabel[selectedBooking.status]}
                </span>
              </div>

              {/* Aktivasi akun Tenant */}
              {selectedActivation && (
                <div
                  className={`rounded-xl border p-4 ${
                    selectedActivation === "ACTIVATED"
                      ? "border-green-200 bg-green-50"
                      : selectedActivation === "WAITING"
                        ? "border-amber-200 bg-amber-50"
                        : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-slate-600">
                      <KeyRound size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">
                        {selectedActivation === "ACTIVATED"
                          ? "Akun Tenant sudah aktif"
                          : selectedActivation === "WAITING"
                            ? "Tenant belum mengaktivasi akun"
                            : "Token aktivasi sudah kedaluwarsa"}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {selectedActivation === "ACTIVATED"
                          ? "Tenant sudah membuat password sendiri, tidak ada token yang perlu diberikan."
                          : selectedActivation === "WAITING"
                            ? `Token berlaku sampai ${formatDateTime(selectedBooking.user?.activationExpiresAt)}. Demi keamanan token lama tidak dapat ditampilkan lagi. Jika lupa disalin, buat token baru.`
                            : "Buat token baru lalu berikan kepada Tenant agar bisa mengaktivasi akun."}
                      </p>

                      {selectedActivation !== "ACTIVATED" && (
                        <button
                          onClick={handleRegenerateToken}
                          disabled={processing}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <KeyRound size={16} />
                          {processing ? "Memproses..." : "Buat Token Baru"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                disabled={processing}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Tutup
              </button>

              {selectedBooking.status === "PENDING" && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processing ? "Memproses..." : "Setujui Pemesanan"}
                  </button>

                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processing ? "Memproses..." : "Tolak Pemesanan"}
                  </button>
                </>
              )}

              {selectedBooking.status === "APPROVED" && (
                <button
                  onClick={handleCancelApproved}
                  disabled={processing}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? "Memproses..." : "Batalkan Pemesanan"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activationToken && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-600">
                <ClipboardList size={22} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {tokenRegenerated
                    ? "Token Aktivasi Baru"
                    : "Pemesanan Berhasil Disetujui"}
                </h2>
                <p className="text-sm text-slate-500">
                  Token aktivasi akun Tenant
                </p>
              </div>
            </div>

            <p className="mb-2 text-sm text-slate-600">
              Salin token berikut dan berikan kepada Tenant untuk aktivasi akun.
            </p>

            {tokenExpiresAt && (
              <p className="mb-2 text-xs text-slate-500">
                Berlaku sampai {formatDateTime(tokenExpiresAt)}. Token
                sebelumnya sudah tidak berlaku.
              </p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                ref={tokenInputRef}
                value={activationToken}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-800 outline-none"
              />

              <button
                onClick={async () => {
                  const success = await copyToClipboard(activationToken);

                  setCopySuccess(success);

                  if (!success) {
                    // Pilih teks token agar tinggal tekan Ctrl+C / Salin
                    tokenInputRef.current?.focus();
                    tokenInputRef.current?.select();
                    alert(
                      "Gagal menyalin otomatis. Token sudah terpilih, silakan tekan Ctrl+C (atau tahan lalu pilih Salin).",
                    );
                  }
                }}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {copySuccess ? "Tersalin!" : "Salin"}
              </button>
            </div>

            {copySuccess && (
              <p className="mt-2 text-sm text-green-600">
                Token berhasil disalin ke clipboard.
              </p>
            )}

            <button
              onClick={() => {
                setActivationToken("");
                setCopySuccess(false);
                setTokenExpiresAt("");
                setTokenRegenerated(false);
              }}
              className="mt-5 w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-900"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Bookings;
