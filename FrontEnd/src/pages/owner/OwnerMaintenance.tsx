
import { useEffect, useState } from "react";
import {
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  RefreshCw,
  AlertCircle,
  UserRound,
  DoorOpen,
  Search,
  Filter,
} from "lucide-react";

import {
  getMaintenance,
  updateMaintenanceStatus,
  type MaintenanceRequest,
  type MaintenanceStatus,
} from "../../services/maintenance.service";

const API_URL = "http://localhost:3000";

const getPhotoUrl = (photoUrl: string) => {
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }

  return `${API_URL}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;
};

function OwnerMaintenance() {
  const [reports, setReports] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedReport, setSelectedReport] =
    useState<MaintenanceRequest | null>(null);

  const [selectedStatus, setSelectedStatus] =
    useState<MaintenanceStatus>("PROCESSING");

  const [ownerNote, setOwnerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMaintenance();
      setReports(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil data keluhan",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedReport) return;

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await updateMaintenanceStatus(selectedReport.id, {
        status: selectedStatus,
        ownerNote: ownerNote.trim() || undefined,
      });

      setSelectedReport(null);
      setOwnerNote("");
      setSuccess("Status laporan berhasil diperbarui.");

      await fetchReports();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memperbarui status laporan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatus = (status: MaintenanceStatus) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Menunggu",
          className: "bg-amber-100 text-amber-700",
          icon: Clock,
        };

      case "PROCESSING":
        return {
          label: "Sedang Diproses",
          className: "bg-blue-100 text-blue-700",
          icon: LoaderCircle,
        };

      case "COMPLETED":
        return {
          label: "Selesai",
          className: "bg-emerald-100 text-emerald-700",
          icon: CheckCircle2,
        };

      case "REJECTED":
        return {
          label: "Ditolak",
          className: "bg-red-100 text-red-700",
          icon: XCircle,
        };
    }
  };

  const pendingCount = reports.filter(
    (report) => report.status === "PENDING",
  ).length;

  const processingCount = reports.filter(
    (report) => report.status === "PROCESSING",
  ).length;

  const completedCount = reports.filter(
    (report) => report.status === "COMPLETED",
  ).length;

  const filteredReports = reports.filter((report) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      !keyword ||
      report.title.toLowerCase().includes(keyword) ||
      (report.lease?.user?.name ?? "").toLowerCase().includes(keyword) ||
      (report.room?.roomNumber ?? "").toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === "ALL" || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Memuat laporan keluhan...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Keluhan Tenant
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Kelola laporan kerusakan dan permintaan perbaikan kamar.
            </p>
          </div>

          <button
            onClick={fetchReports}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Ringkasan */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Keluhan</p>
            <h3 className="mt-2 text-3xl font-bold text-slate-800">
              {reports.length}
            </h3>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Menunggu</p>
            <h3 className="mt-2 text-3xl font-bold text-amber-600">
              {pendingCount}
            </h3>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Diproses</p>
            <h3 className="mt-2 text-3xl font-bold text-blue-600">
              {processingCount}
            </h3>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Selesai</p>
            <h3 className="mt-2 text-3xl font-bold text-emerald-600">
              {completedCount}
            </h3>
          </div>
        </div>

        {/* Pencarian dan Filter */}
        <div className="mb-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cari Laporan
              </label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul, nama tenant, atau nomor kamar..."
                  className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Filter Status
              </label>
              <div className="relative">
                <Filter
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING">Menunggu</option>
                  <option value="PROCESSING">Sedang Diproses</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="REJECTED">Ditolak</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Menampilkan <strong>{filteredReports.length}</strong> dari{" "}
              <strong>{reports.length}</strong> laporan
            </p>

            {(search || statusFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Daftar Laporan */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-white p-10 text-center shadow-sm">
              <Wrench size={40} className="mx-auto text-slate-300" />
              <p className="mt-4 font-medium text-slate-700">
                Belum ada laporan keluhan.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Laporan dari Tenant akan muncul di sini.
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-white p-10 text-center shadow-sm">
              <Search size={40} className="mx-auto text-slate-300" />
              <p className="mt-4 font-medium text-slate-700">
                Laporan tidak ditemukan.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Coba ubah kata kunci pencarian atau filter status.
              </p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const status = getStatus(report.status);
              const StatusIcon = status.icon;

              return (
                <div
                  key={report.id}
                  className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {report.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <UserRound size={15} />
                          {report.lease?.user?.name || "Tenant"}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <DoorOpen size={15} />
                          Kamar {report.room?.roomNumber || "-"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${status.className}`}
                    >
                      <StatusIcon size={14} />
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-5 rounded-lg bg-slate-50 p-4">
                    <p className="text-sm leading-relaxed text-slate-600">
                      {report.description}
                    </p>
                  </div>

                  {report.photoUrl && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-semibold text-slate-700">
                        Foto Kerusakan dari Tenant
                      </p>

                      <a
                        href={getPhotoUrl(report.photoUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block"
                      >
                        <img
                          src={getPhotoUrl(report.photoUrl)}
                          alt="Foto kerusakan kamar"
                          className="max-h-72 rounded-lg border border-slate-200 object-contain"
                        />
                        <p className="mt-2 text-xs text-blue-600">
                          Klik foto untuk melihat ukuran penuh
                        </p>
                      </a>
                    </div>
                  )}

                  {report.ownerNote && (
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-semibold text-blue-700">
                        Catatan Owner
                      </p>
                      <p className="mt-1 text-sm text-blue-800">
                        {report.ownerNote}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">
                      {new Date(report.createdAt).toLocaleString("id-ID")}
                    </p>

                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setSelectedStatus(
                          report.status === "PENDING"
                            ? "PROCESSING"
                            : report.status,
                        );
                        setOwnerNote(report.ownerNote || "");
                      }}
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      Kelola Laporan
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Kelola Status */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-800">Kelola Laporan</h2>

            <p className="mt-1 text-sm text-slate-500">
              {selectedReport.title}
            </p>

            <form onSubmit={handleUpdateStatus}>
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Status Laporan
                </label>

                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as MaintenanceStatus)
                  }
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="PROCESSING">Sedang Diproses</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="REJECTED">Ditolak</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Catatan untuk Tenant
                </label>

                <textarea
                  value={ownerNote}
                  onChange={(e) => setOwnerNote(e.target.value)}
                  rows={4}
                  placeholder="Tuliskan catatan atau alasan penolakan..."
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setSelectedReport(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerMaintenance;
