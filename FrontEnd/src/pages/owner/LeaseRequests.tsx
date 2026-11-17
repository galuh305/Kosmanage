import { useEffect, useState } from "react";
import { CalendarPlus, LogOut, RefreshCw, X } from "lucide-react";

import {
  getLeaseRequests,
  approveLeaseExtension,
  rejectLeaseExtension,
  approveLeaseTermination,
  rejectLeaseTermination,
  type LeaseRequests as LeaseRequestsData,
  type OwnerLeaseExtension,
  type OwnerLeaseTermination,
} from "../../services/lease.service";

const formatDate = (date: string) =>
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

const toDateInput = (date: string) => new Date(date).toISOString().slice(0, 10);

const statusStyle: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Menunggu", className: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Disetujui", className: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Selesai", className: "bg-green-100 text-green-700" },
  REJECTED: { label: "Ditolak", className: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Dibatalkan", className: "bg-slate-100 text-slate-600" },
};

const statusOrder = ["PENDING", "APPROVED", "COMPLETED", "REJECTED", "CANCELLED"];

const sortByStatus = <T extends { status: string; createdAt: string }>(
  items: T[]
) =>
  [...items].sort((a, b) => {
    const byStatus =
      statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    if (byStatus !== 0) return byStatus;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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

type ModalState =
  | { kind: "extension"; action: "approve" | "reject"; item: OwnerLeaseExtension }
  | { kind: "termination"; action: "approve" | "reject"; item: OwnerLeaseTermination }
  | null;

function LeaseRequests() {
  const [data, setData] = useState<LeaseRequestsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState<"extensions" | "terminations">("extensions");

  const [modal, setModal] = useState<ModalState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Isian modal
  const [ownerNote, setOwnerNote] = useState("");
  const [moveOutDate, setMoveOutDate] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [deductionAmount, setDeductionAmount] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      setData(await getLeaseRequests());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil pengajuan."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (next: NonNullable<ModalState>) => {
    setModal(next);
    setOwnerNote("");
    setRefundAmount("");
    setDeductionAmount("");
    setModalError("");
    setSuccess("");

    if (next.kind === "termination") {
      setMoveOutDate(toDateInput(next.item.requestedMoveOutDate));
    }
  };

  const closeModal = () => {
    if (submitting) return;
    setModal(null);
    setModalError("");
  };

  const handleSubmit = async () => {
    if (!modal) return;

    if (modal.action === "reject" && !ownerNote.trim()) {
      setModalError("Alasan penolakan wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      if (modal.kind === "extension") {
        if (modal.action === "approve") {
          await approveLeaseExtension(modal.item.id, ownerNote.trim() || undefined);
          setSuccess("Perpanjangan disetujui dan tagihan sudah dibuat untuk Tenant.");
        } else {
          await rejectLeaseExtension(modal.item.id, ownerNote.trim());
          setSuccess("Perpanjangan ditolak.");
        }
      } else if (modal.action === "approve") {
        await approveLeaseTermination(modal.item.id, {
          ownerNote: ownerNote.trim() || undefined,
          actualMoveOutDate: moveOutDate || undefined,
          refundAmount: refundAmount === "" ? undefined : Number(refundAmount),
          deductionAmount:
            deductionAmount === "" ? undefined : Number(deductionAmount),
        });
        setSuccess("Pengajuan pindah disetujui.");
      } else {
        await rejectLeaseTermination(modal.item.id, ownerNote.trim());
        setSuccess("Pengajuan pindah ditolak.");
      }

      setModal(null);
      await fetchData();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Gagal memproses pengajuan."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const extensions = sortByStatus(data?.extensions ?? []);
  const terminations = sortByStatus(data?.terminations ?? []);

  const pendingExtensions = extensions.filter((i) => i.status === "PENDING").length;
  const pendingTerminations = terminations.filter((i) => i.status === "PENDING").length;

  const tenantInfo = (item: OwnerLeaseExtension | OwnerLeaseTermination) => (
    <div>
      <p className="font-semibold text-slate-800">{item.lease.user.name}</p>
      <p className="text-sm text-slate-500">
        Kamar {item.lease.room.roomNumber} - {item.lease.room.name}
      </p>
      <p className="text-xs text-slate-400">
        {item.lease.user.email}
        {item.lease.user.phone ? ` • ${item.lease.user.phone}` : ""}
      </p>
    </div>
  );

  return (
    <div className="space-y-6 p-5 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Perpanjangan & Pindah
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tinjau pengajuan perpanjangan sewa dan pindah lebih awal dari Tenant.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tab */}
      <div className="flex gap-2 border-b border-slate-200">
        {(
          [
            ["extensions", "Perpanjangan", CalendarPlus, pendingExtensions],
            ["terminations", "Pindah", LogOut, pendingTerminations],
          ] as const
        ).map(([key, label, Icon, pending]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              tab === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={17} />
            {label}
            {pending > 0 && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="p-6 text-center text-slate-500">Memuat pengajuan...</div>
      ) : tab === "extensions" ? (
        <div className="space-y-4">
          {extensions.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Belum ada pengajuan perpanjangan.
            </div>
          )}

          {extensions.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                {tenantInfo(item)}
                <StatusBadge status={item.status} />
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-slate-500">Lama perpanjangan</p>
                  <p className="font-medium text-slate-800">
                    {item.requestedMonths} bulan
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Berakhir sekarang</p>
                  <p className="font-medium text-slate-800">
                    {formatDate(item.lease.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Menjadi</p>
                  <p className="font-medium text-slate-800">
                    {formatDate(item.approvedEndDate ?? item.requestedEndDate)}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-600">
                Estimasi tagihan:{" "}
                <strong>
                  {formatRupiah(Number(item.lease.monthlyPrice) * item.requestedMonths)}
                </strong>
              </p>

              {item.tenantNote && (
                <p className="mt-2 text-sm text-slate-500">
                  Catatan Tenant: {item.tenantNote}
                </p>
              )}
              {item.ownerNote && (
                <p className="mt-1 text-sm text-slate-500">
                  Catatan Owner: {item.ownerNote}
                </p>
              )}
              {item.invoice && (
                <p className="mt-1 text-sm text-slate-500">
                  Tagihan {item.invoice.invoiceNumber}:{" "}
                  {item.invoice.status === "PAID"
                    ? "sudah lunas"
                    : item.invoice.status === "CANCELLED"
                      ? "dibatalkan"
                      : "menunggu pembayaran"}
                </p>
              )}

              {item.status === "PENDING" && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() =>
                      openModal({ kind: "extension", action: "approve", item })
                    }
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() =>
                      openModal({ kind: "extension", action: "reject", item })
                    }
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Tolak
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {terminations.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Belum ada pengajuan pindah.
            </div>
          )}

          {terminations.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                {tenantInfo(item)}
                <StatusBadge status={item.status} />
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-slate-500">Tanggal pindah</p>
                  <p className="font-medium text-slate-800">
                    {formatDate(item.actualMoveOutDate ?? item.requestedMoveOutDate)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Sewa semula berakhir</p>
                  <p className="font-medium text-slate-800">
                    {item.status === "PENDING"
                      ? formatDate(item.lease.endDate)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Pengembalian / potongan</p>
                  <p className="font-medium text-slate-800">
                    {item.refundAmount !== null || item.deductionAmount !== null
                      ? `${formatRupiah(item.refundAmount ?? 0)} / ${formatRupiah(item.deductionAmount ?? 0)}`
                      : "-"}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-600">Alasan: {item.reason}</p>

              {item.tenantNote && (
                <p className="mt-1 text-sm text-slate-500">
                  Catatan Tenant: {item.tenantNote}
                </p>
              )}
              {item.ownerNote && (
                <p className="mt-1 text-sm text-slate-500">
                  Catatan Owner: {item.ownerNote}
                </p>
              )}

              {item.status === "PENDING" && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() =>
                      openModal({ kind: "termination", action: "approve", item })
                    }
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() =>
                      openModal({ kind: "termination", action: "reject", item })
                    }
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Tolak
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal keputusan */}
      {modal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                {modal.action === "approve" ? "Setujui" : "Tolak"}{" "}
                {modal.kind === "extension" ? "Perpanjangan" : "Pengajuan Pindah"}
              </h2>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-800">
                {modal.item.lease.user.name}
              </p>
              <p className="text-slate-500">
                Kamar {modal.item.lease.room.roomNumber}
              </p>
            </div>

            {modal.kind === "extension" && modal.action === "approve" && (
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Tagihan perpanjangan sebesar{" "}
                <strong>
                  {formatRupiah(
                    Number(modal.item.lease.monthlyPrice) *
                      modal.item.requestedMonths
                  )}
                </strong>{" "}
                akan dibuat untuk Tenant. Masa sewa baru bertambah otomatis
                setelah kamu menyetujui bukti transfernya.
              </p>
            )}

            {modal.kind === "termination" && modal.action === "approve" && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Tanggal pindah sebenarnya
                  </label>
                  <input
                    type="date"
                    value={moveOutDate}
                    min={toDateInput(modal.item.lease.startDate)}
                    max={toDateInput(modal.item.lease.endDate)}
                    onChange={(e) => setMoveOutDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Kamar kembali tersedia mulai tanggal ini. Tagihan yang
                    belum dibayar untuk periode sesudahnya otomatis dibatalkan.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Pengembalian dana (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Potongan (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={deductionAmount}
                      onChange={(e) => setDeductionAmount(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Nominal ini hanya dicatat sebagai keputusan. Transfer
                  pengembalian dilakukan manual oleh kamu.
                </p>
              </div>
            )}

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {modal.action === "approve"
                  ? "Catatan Owner (opsional)"
                  : "Alasan penolakan (wajib)"}
              </label>
              <textarea
                value={ownerNote}
                onChange={(e) => setOwnerNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {modalError && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {modalError}
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
                onClick={handleSubmit}
                disabled={submitting}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
                  modal.action === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {submitting
                  ? "Memproses..."
                  : modal.action === "approve"
                    ? "Setujui"
                    : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaseRequests;
