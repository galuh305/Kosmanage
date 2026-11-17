
import { useEffect, useState } from "react";
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Image as ImageIcon,
  X,
  Check,
  Ban,
  Eye,
  AlertCircle,
} from "lucide-react";

import {
  getPayments,
  getPaymentProof,
  approvePayment,
  rejectPayment,
  type Payment,
} from "../../services/payment.service";

function formatRupiah(amount: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING_VERIFICATION":
      return "Menunggu Verifikasi";
    case "APPROVED":
      return "Disetujui";
    case "REJECTED":
      return "Ditolak";
    default:
      return status;
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "PENDING_VERIFICATION":
      return "bg-yellow-100 text-yellow-700";
    case "APPROVED":
      return "bg-green-100 text-green-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function OwnerPayment() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Bukti transfer
  const [proofImage, setProofImage] = useState("");
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState("");

  // Proses pembayaran
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Modal konfirmasi
  const [selectedPayment, setSelectedPayment] =
    useState<Payment | null>(null);
  const [ownerNote, setOwnerNote] = useState("");
  const [actionType, setActionType] =
    useState<"approve" | "reject" | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPayments();
      setPayments(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data pembayaran."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Membersihkan URL gambar sementara
  useEffect(() => {
    return () => {
      if (proofImage) {
        URL.revokeObjectURL(proofImage);
      }
    };
  }, [proofImage]);

  // Menampilkan bukti transfer
  const handleViewProof = async (paymentId: number) => {
    try {
      setProofLoading(true);
      setProofError("");

      const blob = await getPaymentProof(paymentId);

      if (!blob.type.startsWith("image/")) {
        throw new Error("File bukti pembayaran bukan gambar.");
      }

      const imageUrl = URL.createObjectURL(blob);
      setProofImage(imageUrl);
    } catch (err) {
      setProofError(
        err instanceof Error
          ? err.message
          : "Gagal menampilkan bukti pembayaran."
      );
    } finally {
      setProofLoading(false);
    }
  };

  // Membuka modal konfirmasi
  const openPaymentConfirmation = (
    payment: Payment,
    type: "approve" | "reject"
  ) => {
    setSelectedPayment(payment);
    setActionType(type);
    setOwnerNote("");
    setActionError("");
    setActionSuccess("");
  };

  // Menutup modal konfirmasi
  const closePaymentConfirmation = () => {
    if (processingId !== null) return;

    setSelectedPayment(null);
    setActionType(null);
    setOwnerNote("");
    setActionError("");
  };

  // Menyetujui atau menolak pembayaran
  const handlePaymentAction = async () => {
    if (!selectedPayment || !actionType) return;

    if (
      actionType === "reject" &&
      !ownerNote.trim()
    ) {
      setActionError("Alasan penolakan wajib diisi.");
      return;
    }

    try {
      setProcessingId(selectedPayment.id);
      setActionError("");
      setActionSuccess("");

      if (actionType === "approve") {
        await approvePayment(
          selectedPayment.id,
          ownerNote.trim() || undefined
        );

        setActionSuccess("Pembayaran berhasil disetujui.");
      } else {
        await rejectPayment(
          selectedPayment.id,
          ownerNote.trim()
        );

        setActionSuccess("Pembayaran berhasil ditolak.");
      }

      setSelectedPayment(null);
      setActionType(null);
      setOwnerNote("");

      await fetchPayments();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Gagal memproses pembayaran."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const pendingPayments = payments.filter(
    (payment) =>
      payment.transactionStatus === "PENDING_VERIFICATION"
  );

  const approvedPayments = payments.filter(
    (payment) =>
      payment.transactionStatus === "APPROVED"
  );

  const rejectedPayments = payments.filter(
    (payment) =>
      payment.transactionStatus === "REJECTED"
  );

  const totalApproved = approvedPayments.reduce(
    (total, payment) => total + Number(payment.amount),
    0
  );

  return (
    <div className="space-y-6 p-5 md:p-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Manajemen Pembayaran
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola dan verifikasi pembayaran sewa dari Tenant.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Notifikasi */}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {actionSuccess}
        </div>
      )}

      {actionError && !selectedPayment && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total Pembayaran
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {payments.length}
              </h3>
            </div>
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <CreditCard size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Menunggu Verifikasi
              </p>
              <h3 className="mt-2 text-2xl font-bold text-yellow-600">
                {pendingPayments.length}
              </h3>
            </div>
            <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
              <Clock size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Pembayaran Disetujui
              </p>
              <h3 className="mt-2 text-2xl font-bold text-green-600">
                {approvedPayments.length}
              </h3>
            </div>
            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Pembayaran Ditolak
              </p>
              <h3 className="mt-2 text-2xl font-bold text-red-600">
                {rejectedPayments.length}
              </h3>
            </div>
            <div className="rounded-xl bg-red-100 p-3 text-red-600">
              <XCircle size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Total dana disetujui */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="text-sm font-medium text-green-700">
          Total Pembayaran Terverifikasi
        </p>
        <h2 className="mt-2 text-2xl font-bold text-green-800">
          {formatRupiah(totalApproved)}
        </h2>
        <p className="mt-1 text-xs text-green-700">
          Akumulasi pembayaran yang sudah disetujui Owner.
        </p>
      </div>

      {/* Tabel Pembayaran */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800">
            Daftar Pembayaran
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Daftar transaksi pembayaran dari seluruh Tenant.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw
              size={28}
              className="animate-spin text-blue-600"
            />
            <p className="mt-3 text-sm text-slate-500">
              Memuat data pembayaran...
            </p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <CreditCard size={40} className="text-slate-300" />
            <p className="mt-3 font-medium text-slate-600">
              Belum ada pembayaran
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Pembayaran Tenant akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Tenant</th>
                  <th className="px-5 py-4 font-medium">Kamar</th>
                  <th className="px-5 py-4 font-medium">Invoice</th>
                  <th className="px-5 py-4 font-medium">Jumlah</th>
                  <th className="px-5 py-4 font-medium">Tanggal</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {payment.invoice?.lease.user.name ?? "-"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {payment.invoice?.lease.user.email ?? "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {payment.invoice?.lease.room.roomNumber ?? "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {payment.invoice?.invoiceNumber ?? `#${payment.invoiceId}`}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {formatRupiah(payment.amount)}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(payment.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                          payment.transactionStatus
                        )}`}
                      >
                        {getStatusLabel(payment.transactionStatus)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleViewProof(payment.id)}
                          disabled={proofLoading}
                          className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                        >
                          <Eye size={16} />
                          Lihat Bukti
                        </button>

                        {payment.transactionStatus ===
                          "PENDING_VERIFICATION" && (
                          <>
                            <button
                              onClick={() =>
                                openPaymentConfirmation(
                                  payment,
                                  "approve"
                                )
                              }
                              className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                            >
                              <Check size={16} />
                              Setujui
                            </button>

                            <button
                              onClick={() =>
                                openPaymentConfirmation(
                                  payment,
                                  "reject"
                                )
                              }
                              className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                            >
                              <Ban size={16} />
                              Tolak
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Bukti Transfer */}
      {proofImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="font-semibold text-slate-800">
                Bukti Transfer
              </h2>

              <button
                onClick={() => setProofImage("")}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex max-h-[75vh] items-center justify-center overflow-auto bg-slate-100 p-4">
              <img
                src={proofImage}
                alt="Bukti transfer pembayaran"
                className="max-h-[65vh] max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Bukti Transfer */}
      {proofError && (
        <div className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-lg border border-red-200 bg-white p-4 shadow-lg">
          <AlertCircle className="shrink-0 text-red-600" size={20} />
          <p className="text-sm text-red-700">{proofError}</p>
          <button
            onClick={() => setProofError("")}
            className="text-slate-400 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Modal Konfirmasi */}
      {selectedPayment && actionType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                {actionType === "approve"
                  ? "Setujui Pembayaran"
                  : "Tolak Pembayaran"}
              </h2>

              <button
                onClick={closePaymentConfirmation}
                disabled={processingId !== null}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm leading-relaxed text-slate-600">
              {actionType === "approve"
                ? "Apakah kamu yakin ingin menyetujui pembayaran ini? Invoice Tenant akan otomatis berubah menjadi PAID."
                : "Apakah kamu yakin ingin menolak pembayaran ini? Berikan alasan agar Tenant dapat memperbaiki dan mengunggah ulang bukti transfer."}
            </p>

            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
              <p className="text-slate-500">
                Pembayaran #{selectedPayment.id}
              </p>
              <p className="mt-1 font-semibold text-slate-800">
                {formatRupiah(selectedPayment.amount)}
              </p>
              <p className="mt-1 text-slate-500">
                Invoice{" "}
                {selectedPayment.invoice?.invoiceNumber ??
                  `#${selectedPayment.invoiceId}`}
              </p>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {actionType === "approve"
                  ? "Catatan Owner (Opsional)"
                  : "Alasan Penolakan (Wajib)"}
              </label>

              <textarea
                value={ownerNote}
                onChange={(e) => setOwnerNote(e.target.value)}
                rows={3}
                placeholder={
                  actionType === "approve"
                    ? "Tambahkan catatan jika diperlukan..."
                    : "Contoh: Bukti transfer tidak jelas, silakan unggah ulang."
                }
                disabled={processingId !== null}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </div>

            {actionError && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {actionError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closePaymentConfirmation}
                disabled={processingId !== null}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                onClick={handlePaymentAction}
                disabled={
                  processingId !== null ||
                  (actionType === "reject" && !ownerNote.trim())
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
                  actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processingId !== null
                  ? "Memproses..."
                  : actionType === "approve"
                    ? "Ya, Setujui"
                    : "Ya, Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerPayment;
