
import { useEffect, useState } from "react";
import {
  CreditCard,
  CalendarDays,
  Receipt,
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

import { bankAccounts } from "../../data/bankAccounts";

import {
  getTenantInvoices,
  createPayment,
  type TenantInvoice,
} from "../../services/payment.service";

function Payments() {
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [selectedBank, setSelectedBank] = useState(bankAccounts[0].id);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await getTenantInvoices();
        setInvoices(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Gagal mengambil tagihan",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleUpload = async (invoiceId: number) => {
    if (!proofFile) {
      setUploadError("Silakan pilih gambar bukti transfer.");
      return;
    }

    if (proofFile.size > 5 * 1024 * 1024) {
      setUploadError("Ukuran gambar maksimal 5 MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(proofFile.type)) {
      setUploadError("Format gambar harus JPG, PNG, atau WEBP.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadMessage("");

      await createPayment({
        invoiceId,
        proof: proofFile,
      });

      setUploadMessage(
        "Bukti transfer berhasil dikirim. Menunggu verifikasi Owner.",
      );

      setProofFile(null);
      setSelectedInvoiceId(null);

      const updatedInvoices = await getTenantInvoices();
      setInvoices(updatedInvoices);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Gagal mengunggah bukti transfer.",
      );
    } finally {
      setUploading(false);
    }
  };

  const formatRupiah = (amount: string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getLatestPayment = (invoice: TenantInvoice) => {
    return [...invoice.payments].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )[0];
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Memuat tagihan...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Pembayaran
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Kelola tagihan dan pembayaran sewa kamar Anda.
        </p>
      </div>

      {uploadMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {uploadMessage}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Rekening Owner */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="text-blue-600" size={20} />
          <div>
            <h2 className="font-semibold text-gray-900">
              Rekening Pembayaran
            </h2>
            <p className="text-sm text-gray-500">
              Pilih rekening tujuan untuk melakukan transfer.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {bankAccounts.map((bank) => (
            <button
              key={bank.id}
              type="button"
              onClick={() => setSelectedBank(bank.id)}
              className={`rounded-xl border p-4 text-left transition ${
                selectedBank === bank.id
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-md px-3 py-1 text-sm font-semibold ${bank.color}`}
                >
                  {bank.bankName}
                </span>

                <span className="text-xs text-gray-500">
                  {selectedBank === bank.id ? "Dipilih" : "Pilih"}
                </span>
              </div>

              <p className="mt-4 text-lg font-bold tracking-wide text-gray-900">
                {bank.accountNumber}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                a.n. {bank.accountName}
              </p>
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Pastikan nomor rekening dan nama pemilik sudah benar sebelum transfer.
        </p>
      </div>

      {/* Daftar Invoice */}
      {!error && invoices.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <Receipt size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-3 font-semibold text-gray-800">
            Belum Ada Tagihan
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Tagihan sewa Anda akan muncul di sini.
          </p>
        </div>
      )}

      <div className="grid gap-5">
        {invoices.map((invoice) => {
          const latestPayment = getLatestPayment(invoice);

          const isPending =
            latestPayment?.transactionStatus === "PENDING_VERIFICATION";

          const isRejected =
            latestPayment?.transactionStatus === "REJECTED";

          return (
            <div
              key={invoice.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {invoice.invoiceNumber}
                  </p>

                  <h3 className="mt-1 font-semibold text-gray-900">
                    {invoice.lease.room.roomNumber}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {invoice.lease.room.name} -{" "}
                    {invoice.lease.room.roomType.name}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    invoice.status === "PAID"
                      ? "bg-green-100 text-green-700"
                      : invoice.status === "UNPAID"
                        ? "bg-yellow-100 text-yellow-700"
                        : invoice.status === "OVERDUE"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {invoice.status}
                </span>
              </div>

              <div className="my-5 border-t border-gray-100" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">
                    Total Tagihan
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatRupiah(invoice.amount)}
                  </p>
                </div>

                <div>
                  <p className="flex items-center gap-1 text-xs text-gray-500">
                    <CalendarDays size={14} />
                    Jatuh Tempo
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              </div>

              {/* Status Pembayaran */}
              {isPending && (
                <div className="mt-5 flex items-start gap-2 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
                  <Clock size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      Menunggu Verifikasi Owner
                    </p>
                    <p className="mt-1">
                      Bukti pembayaran sudah dikirim dan sedang diperiksa.
                    </p>
                  </div>
                </div>
              )}

              {isRejected && (
                <div className="mt-5 flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  <XCircle size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      Pembayaran Ditolak
                    </p>
                    <p className="mt-1">
                      {latestPayment.ownerNote ||
                        "Silakan periksa kembali bukti pembayaran."}
                    </p>
                  </div>
                </div>
              )}

              {invoice.status === "PAID" && (
                <div className="mt-5 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                  <CheckCircle2 size={18} />
                  Pembayaran telah lunas dan diverifikasi.
                </div>
              )}

              {/* Form Upload */}
              {invoice.status !== "PAID" &&
                invoice.status !== "CANCELLED" &&
                !isPending && (
                  <div className="mt-5 space-y-3">
                    {selectedInvoiceId !== invoice.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoiceId(invoice.id);
                          setProofFile(null);
                          setUploadError("");
                          setUploadMessage("");
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <CreditCard size={18} />
                        {isRejected
                          ? "Upload Ulang Bukti Pembayaran"
                          : "Upload Bukti Pembayaran"}
                      </button>
                    ) : (
                      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Pilih Gambar Bukti Transfer
                        </label>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) =>
                            setProofFile(e.target.files?.[0] || null)
                          }
                          className="block w-full text-sm text-gray-600"
                        />

                        <p className="text-xs text-gray-500">
                          Format JPG, PNG, atau WEBP. Maksimal 5 MB.
                        </p>

                        {proofFile && (
                          <p className="text-sm text-gray-600">
                            File: {proofFile.name}
                          </p>
                        )}

                        {uploadError && (
                          <p className="text-sm text-red-600">
                            {uploadError}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() => handleUpload(invoice.id)}
                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {uploading
                              ? "Mengunggah..."
                              : "Kirim Bukti Transfer"}
                          </button>

                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() => {
                              setSelectedInvoiceId(null);
                              setProofFile(null);
                              setUploadError("");
                            }}
                            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Payments;
