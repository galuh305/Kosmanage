import { useEffect, useState } from "react";
import {
  getTenantDashboard,
  type TenantDashboard as TenantDashboardType,
} from "../../services/tenant.service";

function TenantDashboard() {
  const [tenant, setTenant] = useState<TenantDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getTenantDashboard();
        setTenant(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal mengambil data dashboard",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Memuat dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="m-6 rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
    );
  }

  if (!tenant) return null;

  const getLeaseStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (today < start) {
      return "Belum Mulai";
    }

    if (today > end) {
      return "Berakhir";
    }

    return "Aktif";
  };

  const activeLease = tenant.leases[0];

  const leaseDisplayStatus = activeLease
    ? getLeaseStatus(activeLease.startDate, activeLease.endDate)
    : null;

  
return (
  <div className="min-h-screen bg-slate-50 p-6">
    <div className="mx-auto max-w-6xl">

      {/* Judul Dashboard */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard Tenant
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Selamat datang kembali, {tenant.name}!
        </p>
      </div>

      {/* Profil Tenant */}
      <div className="mt-8 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">
          Informasi Profil
        </h2>

        <div className="mt-5 grid gap-6 md:grid-cols-3">

          <div>
            <p className="text-sm text-slate-500">Nama Lengkap</p>
            <p className="mt-1 font-semibold text-slate-800">
              {tenant.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="mt-1 font-semibold text-slate-800">
              {tenant.email}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Nomor Telepon</p>
            <p className="mt-1 font-semibold text-slate-800">
              {tenant.phone || "-"}
            </p>
          </div>

        </div>
      </div>

      {/* Ringkasan Sewa */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Status Sewa
          </p>
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                leaseDisplayStatus === "Aktif"
                  ? "bg-green-100 text-green-700"
                  : leaseDisplayStatus === "Belum Mulai"
                    ? "bg-yellow-100 text-yellow-700"
                    : leaseDisplayStatus === "Berakhir"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-600"
              }`}
            >
              {leaseDisplayStatus || "Belum Ada Sewa"}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Nomor Kamar
          </p>
          <h3 className="mt-3 text-2xl font-bold text-slate-800">
            {activeLease?.room.roomNumber || "-"}
          </h3>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Harga Sewa Per Bulan
          </p>
          <h3 className="mt-3 text-xl font-bold text-blue-600">
            {activeLease
              ? Number(activeLease.monthlyPrice).toLocaleString("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                })
              : "-"}
          </h3>
        </div>

      </div>

      {/* Informasi Sewa */}
      <div className="mt-8 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">
          Informasi Sewa
        </h2>

        {activeLease ? (
          <div className="mt-5 grid gap-6 md:grid-cols-2">

            <div>
              <p className="text-sm text-slate-500">Nomor Kamar</p>
              <p className="mt-1 font-semibold text-slate-800">
                {activeLease.room.roomNumber}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Nama Kamar</p>
              <p className="mt-1 font-semibold text-slate-800">
                {activeLease.room.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Tipe Kamar</p>
              <p className="mt-1 font-semibold text-slate-800">
                {activeLease.room.roomType.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Mulai Sewa</p>
              <p className="mt-1 font-semibold text-slate-800">
                {new Date(activeLease.startDate).toLocaleDateString("id-ID")}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Akhir Sewa</p>
              <p className="mt-1 font-semibold text-slate-800">
                {new Date(activeLease.endDate).toLocaleDateString("id-ID")}
              </p>
            </div>

          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Belum ada informasi sewa.
          </p>
        )}
      </div>

      

    </div>
  </div>
);

}

export default TenantDashboard;
