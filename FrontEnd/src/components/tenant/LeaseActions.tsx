import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarPlus,
  LogOut,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

import type { TenantLease } from "../../services/tenant.service";
import {
  requestLeaseExtension,
  cancelLeaseExtension,
  requestLeaseTermination,
  cancelLeaseTermination,
  type LeaseExtension,
  type LeaseTermination,
} from "../../services/lease.service";

// Harus sama dengan konstanta di Backend/src/services/lease-dates.ts
const EXTENSION_WINDOW_DAYS = 30;
const EXTENSION_GRACE_DAYS = 7;
const MAX_EXTENSION_MONTHS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const formatRupiah = (amount: number | string) =>
  Number(amount).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

// Tambah bulan tanpa meluber ke bulan berikutnya (31 Jan + 1 bln = 28 Feb)
const addMonthsUTC = (date: Date, months: number) => {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)
  );
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return result;
};

const statusStyle: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Menunggu Persetujuan",
    className: "bg-yellow-100 text-yellow-700",
  },
  APPROVED: { label: "Disetujui", className: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Selesai", className: "bg-green-100 text-green-700" },
  REJECTED: { label: "Ditolak", className: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Dibatalkan", className: "bg-slate-100 text-slate-600" },
};

function StatusBadge({ status }: { status: string }) {
  const style = statusStyle[status] ?? statusStyle.CANCELLED;

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  );
}

type Props = {
  lease: TenantLease;
  onChanged: () => void | Promise<void>;
};

function LeaseActions({ lease, onChanged }: Props) {
  const [modal, setModal] = useState<"extend" | "terminate" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form perpanjangan
  const [months, setMonths] = useState(1);
  const [extensionNote, setExtensionNote] = useState("");

  // Form pindah
  const [moveOutDate, setMoveOutDate] = useState("");
  const [reason, setReason] = useState("");
  const [terminationNote, setTerminationNote] = useState("");

  const extensions = lease.extensions ?? [];
  const terminations = lease.terminations ?? [];

  const openExtension = extensions.find((item) =>
    ["PENDING", "APPROVED"].includes(item.status)
  );
  const openTermination = terminations.find((item) =>
    ["PENDING", "APPROVED"].includes(item.status)
  );

  const history = [
    ...extensions
      .filter((item) => !["PENDING", "APPROVED"].includes(item.status))
      .map((item) => ({ kind: "extension" as const, item })),
    ...terminations
      .filter((item) => !["PENDING", "APPROVED"].includes(item.status))
      .map((item) => ({ kind: "termination" as const, item })),
  ].sort(
    (a, b) =>
      new Date(b.item.createdAt).getTime() -
      new Date(a.item.createdAt).getTime()
  );

  const now = Date.now();
  const endDate = new Date(lease.endDate);
  const windowStart = new Date(endDate.getTime() - EXTENSION_WINDOW_DAYS * DAY_MS);
  const windowEnd = new Date(endDate.getTime() + EXTENSION_GRACE_DAYS * DAY_MS);

  const isActive = lease.status === "ACTIVE";
  const hasOpenRequest = Boolean(openExtension || openTermination);
  const inExtensionWindow =
    now >= windowStart.getTime() && now <= windowEnd.getTime();

  const canExtend = isActive && !hasOpenRequest && inExtensionWindow;
  const canTerminate = isActive && !hasOpenRequest && now < endDate.getTime();

  const hasEnded = endDate.getTime() <= now;
  const maxMoveOut = new Date(endDate.getTime() - DAY_MS)
    .toISOString()
    .slice(0, 10);
  const minMoveOut = new Date().toISOString().slice(0, 10);

  const monthlyPrice = Number(lease.monthlyPrice);
  const previewEndDate = addMonthsUTC(endDate, months);

  const closeModal = () => {
    if (submitting) return;
    setModal(null);
    setError("");
  };

  const handleExtend = async () => {
    try {
      setSubmitting(true);
      setError("");

      await requestLeaseExtension(lease.id, {
        months,
        tenantNote: extensionNote.trim() || undefined,
      });

      setSuccess("Pengajuan perpanjangan dikirim. Tunggu persetujuan Owner.");
      setModal(null);
      setExtensionNote("");
      setMonths(1);
      await onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengajukan perpanjangan."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminate = async () => {
    if (!moveOutDate) {
      setError("Tanggal pindah wajib diisi.");
      return;
    }

    if (!reason.trim()) {
      setError("Alasan pindah wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await requestLeaseTermination(lease.id, {
        requestedMoveOutDate: moveOutDate,
        reason: reason.trim(),
        tenantNote: terminationNote.trim() || undefined,
      });

      setSuccess("Pengajuan pindah dikirim. Tunggu persetujuan Owner.");
      setModal(null);
      setMoveOutDate("");
      setReason("");
      setTerminationNote("");
      await onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengajukan pindah."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (
    kind: "extension" | "termination",
    id: number
  ) => {
    const confirmed = window.confirm(
      kind === "extension"
        ? "Batalkan pengajuan perpanjangan ini?"
        : "Batalkan pengajuan pindah ini?"
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (kind === "extension") {
        await cancelLeaseExtension(id);
      } else {
        await cancelLeaseTermination(id);
      }

      setSuccess("Pengajuan berhasil dibatalkan.");
      await onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal membatalkan pengajuan."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderOpenExtension = (extension: LeaseExtension) => (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <CalendarPlus size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              Perpanjangan {extension.requestedMonths} bulan
            </h3>
            <p className="text-sm text-slate-500">
              Sampai {formatDate(extension.approvedEndDate ?? extension.requestedEndDate)}
            </p>
          </div>
        </div>
        <StatusBadge status={extension.status} />
      </div>

      {extension.status === "PENDING" && (
        <p className="mt-4 text-sm text-slate-600">
          Pengajuan kamu sedang ditinjau Owner. Tagihan perpanjangan akan
          muncul setelah disetujui.
        </p>
      )}

      {extension.status === "APPROVED" && (
        <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-medium">
            Perpanjangan disetujui. Selesaikan pembayaran agar masa sewa
            resmi diperpanjang.
          </p>
          {extension.invoice && (
            <p className="mt-2">
              Tagihan {extension.invoice.invoiceNumber}:{" "}
              <strong>{formatRupiah(extension.invoice.amount)}</strong>, jatuh
              tempo {formatDate(extension.invoice.dueDate)}.
            </p>
          )}
          <Link
            to="/tenant/invoices"
            className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Lihat Tagihan
          </Link>
        </div>
      )}

      {extension.ownerNote && (
        <p className="mt-3 text-sm text-slate-500">
          Catatan Owner: {extension.ownerNote}
        </p>
      )}

      <button
        onClick={() => handleCancel("extension", extension.id)}
        disabled={submitting}
        className="mt-4 text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        Batalkan pengajuan
      </button>
    </div>
  );

  const renderOpenTermination = (termination: LeaseTermination) => (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-50 p-3 text-orange-600">
            <LogOut size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              Pengajuan pindah
            </h3>
            <p className="text-sm text-slate-500">
              Tanggal pindah:{" "}
              {formatDate(
                termination.actualMoveOutDate ?? termination.requestedMoveOutDate
              )}
            </p>
          </div>
        </div>
        <StatusBadge status={termination.status} />
      </div>

      <p className="mt-4 text-sm text-slate-600">
        Alasan: {termination.reason}
      </p>

      {termination.status === "APPROVED" && (
        <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-medium">
            Pengajuan disetujui. Sewa akan berakhir pada tanggal pindah di atas.
          </p>
          {termination.refundAmount !== null && (
            <p className="mt-2">
              Pengembalian dana: {formatRupiah(termination.refundAmount)}
            </p>
          )}
          {termination.deductionAmount !== null && (
            <p className="mt-1">
              Potongan: {formatRupiah(termination.deductionAmount)}
            </p>
          )}
        </div>
      )}

      {termination.ownerNote && (
        <p className="mt-3 text-sm text-slate-500">
          Catatan Owner: {termination.ownerNote}
        </p>
      )}

      {termination.status === "PENDING" && (
        <button
          onClick={() => handleCancel("termination", termination.id)}
          disabled={submitting}
          className="mt-4 text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Batalkan pengajuan
        </button>
      )}
    </div>
  );

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-bold text-slate-800">
        Perpanjangan & Pindah
      </h2>

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {error && !modal && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {openExtension && renderOpenExtension(openExtension)}
      {openTermination && renderOpenTermination(openTermination)}

      {isActive && !hasOpenRequest && (
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          {hasEnded && (
            <p className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              Masa sewa kamu sudah berakhir. Ajukan perpanjangan sebelum{" "}
              {formatDate(windowEnd)} agar tidak kehilangan kamar.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setModal("extend");
                setError("");
                setSuccess("");
              }}
              disabled={!canExtend}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CalendarPlus size={18} />
              Perpanjang Sewa
            </button>

            <button
              onClick={() => {
                setModal("terminate");
                setError("");
                setSuccess("");
              }}
              disabled={!canTerminate}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <LogOut size={18} />
              Pindah / Berhenti Lebih Awal
            </button>
          </div>

          {!canExtend && now < windowStart.getTime() && (
            <p className="mt-3 text-xs text-slate-500">
              Perpanjangan bisa diajukan mulai {formatDate(windowStart)}{" "}
              ({EXTENSION_WINDOW_DAYS} hari sebelum sewa berakhir).
            </p>
          )}
        </div>
      )}

      {!isActive && !hasOpenRequest && (
        <div className="rounded-xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-sm">
          {lease.status === "TERMINATED"
            ? "Sewa ini sudah dihentikan lebih awal."
            : "Masa sewa ini sudah selesai. Untuk menyewa lagi, silakan buat pemesanan baru."}
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-semibold text-slate-800">Riwayat Pengajuan</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {history.map(({ kind, item }) => (
              <div
                key={`${kind}-${item.id}`}
                className="flex flex-wrap items-start justify-between gap-3 p-5"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {kind === "extension"
                      ? `Perpanjangan ${(item as LeaseExtension).requestedMonths} bulan`
                      : "Pindah / berhenti lebih awal"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Diajukan {formatDate(item.createdAt)}
                    {kind === "termination" &&
                      ` • pindah ${formatDate(
                        (item as LeaseTermination).actualMoveOutDate ??
                          (item as LeaseTermination).requestedMoveOutDate
                      )}`}
                  </p>
                  {item.ownerNote && (
                    <p className="mt-1 text-sm text-slate-500">
                      Catatan Owner: {item.ownerNote}
                    </p>
                  )}
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal perpanjangan */}
      {modal === "extend" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Perpanjang Sewa
              </h2>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Lama perpanjangan
            </label>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              {Array.from({ length: MAX_EXTENSION_MONTHS }, (_, i) => i + 1).map(
                (value) => (
                  <option key={value} value={value}>
                    {value} bulan
                  </option>
                )
              )}
            </select>

            <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Berakhir sekarang</span>
                <span className="font-medium text-slate-800">
                  {formatDate(endDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Berakhir setelah perpanjangan</span>
                <span className="font-medium text-slate-800">
                  {formatDate(previewEndDate)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Total tagihan</span>
                <span className="font-bold text-blue-600">
                  {formatRupiah(monthlyPrice * months)}
                </span>
              </div>
            </div>

            <label className="mb-2 mt-4 block text-sm font-medium text-slate-700">
              Catatan untuk Owner (opsional)
            </label>
            <textarea
              value={extensionNote}
              onChange={(e) => setExtensionNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />

            <p className="mt-3 text-xs text-slate-500">
              Masa sewa baru resmi diperpanjang setelah Owner menyetujui dan
              pembayaran perpanjangan diverifikasi.
            </p>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleExtend}
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Mengirim..." : "Ajukan Perpanjangan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pindah */}
      {modal === "terminate" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Pindah / Berhenti Lebih Awal
              </h2>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tanggal pindah
            </label>
            <input
              type="date"
              value={moveOutDate}
              min={minMoveOut}
              max={maxMoveOut}
              onChange={(e) => setMoveOutDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              Sewa kamu berakhir {formatDate(endDate)}.
            </p>

            <label className="mb-2 mt-4 block text-sm font-medium text-slate-700">
              Alasan pindah (wajib)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Contoh: pindah kerja ke luar kota."
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />

            <label className="mb-2 mt-4 block text-sm font-medium text-slate-700">
              Catatan tambahan (opsional)
            </label>
            <textarea
              value={terminationNote}
              onChange={(e) => setTerminationNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />

            <div className="mt-4 flex gap-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
              <Clock size={16} className="mt-0.5 shrink-0" />
              <p>
                Tagihan yang belum dibayar untuk periode setelah tanggal
                pindah akan dibatalkan. Pembayaran yang sudah masuk tidak
                otomatis dikembalikan; besaran pengembalian atau potongan
                ditentukan Owner.
              </p>
            </div>

            {error && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <XCircle size={16} className="shrink-0" />
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleTerminate}
                disabled={submitting}
                className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {submitting ? "Mengirim..." : "Ajukan Pindah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaseActions;
