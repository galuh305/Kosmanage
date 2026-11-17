
import { useEffect, useState } from "react";
import {
  Wrench,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  AlertCircle,
  ImagePlus,
  X,
  Search,
  Filter,
} from "lucide-react";

import {
  getTenantDashboard,
  type TenantDashboard,
} from "../../services/tenant.service";

import {
  getTenantMaintenance,
  createMaintenance,
  type MaintenanceRequest,
} from "../../services/maintenance.service";

const API_URL = "http://localhost:3000";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function MyMaintenance() {
  const [tenant, setTenant] = useState<TenantDashboard | null>(null);
  const [reports, setReports] = useState<MaintenanceRequest[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const activeLease = tenant?.leases.find(
    (lease) => lease.status === "ACTIVE"
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [dashboardData, maintenanceData] = await Promise.all([
        getTenantDashboard(),
        getTenantMaintenance(),
      ]);

      setTenant(dashboardData);
      setReports(maintenanceData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data keluhan"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(photo);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  const handlePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhoto(null);
      e.target.value = "";
      setError("Format foto harus JPG, PNG, atau WEBP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setPhoto(null);
      e.target.value = "";
      setError("Ukuran foto maksimal 5 MB.");
      return;
    }

    setPhoto(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPreview("");

    const input = document.getElementById(
      "maintenance-photo"
    ) as HTMLInputElement | null;

    if (input) input.value = "";
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!activeLease) {
      setError("Kamu belum memiliki sewa kamar yang aktif.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await createMaintenance({
        leaseId: activeLease.id,
        roomId: activeLease.room.id,
        title,
        description,
        photo,
      });

      setTitle("");
      setDescription("");
      setPhoto(null);
      setPreview("");

      setSuccess("Laporan keluhan berhasil dikirim.");

      const updatedReports = await getTenantMaintenance();
      setReports(updatedReports);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengirim laporan keluhan"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getPhotoUrl = (photoUrl: string) => {
    if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
      return photoUrl;
    }

    return `${API_URL}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;
  };

  const getStatus = (status: MaintenanceRequest["status"]) => {
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

  const filteredReports = reports.filter((report) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      !keyword ||
      report.title.toLowerCase().includes(keyword) ||
      (report.room?.roomNumber ?? "").toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === "ALL" || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Memuat data keluhan...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Keluhan Saya
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Laporkan kerusakan atau fasilitas kamar yang membutuhkan perbaikan.
          </p>
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

        {activeLease ? (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <Wrench size={22} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">
                  Buat Laporan Keluhan
                </h2>
                <p className="text-sm text-slate-500">
                  Kamar {activeLease.room.roomNumber}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Judul Keluhan
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: AC kamar tidak dingin"
                required
                minLength={3}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Deskripsi Keluhan
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan kerusakan atau masalah yang terjadi..."
                required
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Upload Foto */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Foto Kerusakan (Opsional)
              </label>

              {!preview ? (
                <label
                  htmlFor="maintenance-photo"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50"
                >
                  <ImagePlus size={32} className="text-slate-400" />
                  <span className="mt-3 text-sm font-medium text-slate-700">
                    Pilih foto kerusakan
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    JPG, PNG, WEBP — Maksimal 5 MB
                  </span>

                  <input
                    id="maintenance-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={preview}
                    alt="Preview foto kerusakan"
                    className="max-h-64 max-w-full rounded-xl border border-slate-200 object-contain"
                  />

                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -right-3 -top-3 rounded-full bg-red-500 p-2 text-white shadow hover:bg-red-600"
                    title="Hapus foto"
                  >
                    <X size={16} />
                  </button>

                  <p className="mt-2 text-xs text-slate-500">
                    {photo?.name}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={17} />
              {submitting ? "Mengirim..." : "Kirim Laporan"}
            </button>
          </form>
        ) : (
          <div className="mb-8 rounded-xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <Wrench size={36} className="mx-auto text-slate-400" />
            <p className="mt-3 font-medium text-slate-700">
              Belum ada sewa kamar aktif.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Kamu harus memiliki sewa aktif untuk membuat laporan keluhan.
            </p>
          </div>
        )}

        {/* Riwayat Keluhan */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Riwayat Keluhan
          </h2>

          {/* Pencarian dan Filter */}
          <div className="mb-5 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Cari Keluhan
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
                    placeholder="Cari judul atau nomor kamar..."
                    className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
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
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
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
                  type="button"
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

          {reports.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-white p-8 text-center shadow-sm">
              <Wrench size={34} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                Belum ada laporan keluhan.
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-white p-8 text-center shadow-sm">
              <Search size={34} className="mx-auto text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">
                Laporan tidak ditemukan.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Coba ubah kata kunci atau filter status.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => {
                const status = getStatus(report.status);
                const StatusIcon = status.icon;

                return (
                  <div
                    key={report.id}
                    className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {report.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Kamar {report.room?.roomNumber ?? "-"}
                        </p>
                      </div>

                      <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${status.className}`}
                      >
                        <StatusIcon size={14} />
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                      {report.description}
                    </p>

                    {report.photoUrl && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold text-slate-600">
                          Foto Kerusakan
                        </p>
                        <a
                          href={getPhotoUrl(report.photoUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={getPhotoUrl(report.photoUrl)}
                            alt="Foto kerusakan"
                            className="max-h-64 rounded-lg border border-slate-200 object-contain"
                          />
                        </a>
                      </div>
                    )}

                    {report.ownerNote && (
                      <div className="mt-4 rounded-lg bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-700">
                          Catatan Pemilik Kos
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {report.ownerNote}
                        </p>
                      </div>
                    )}

                    <p className="mt-4 text-xs text-slate-400">
                      Dilaporkan:{" "}
                      {new Date(report.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyMaintenance;
