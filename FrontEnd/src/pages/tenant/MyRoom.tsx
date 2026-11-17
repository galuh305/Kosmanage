
import { useEffect, useState } from "react";
import {
  getTenantDashboard,
  type TenantDashboard as TenantDashboardType,
} from "../../services/tenant.service";
import API_URL from "../../config/api";
import LeaseActions from "../../components/tenant/LeaseActions";

import {
  DoorOpen,
  CalendarDays,
  Wallet,
  Image as ImageIcon,
} from "lucide-react";

function MyRoom() {
  const [tenant, setTenant] = useState<TenantDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRoom = async () => {
    try {
      const data = await getTenantDashboard();
      setTenant(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil informasi kamar"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">
        Memuat data kamar...
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 rounded-lg bg-red-50 p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (!tenant) return null;

  const lease = tenant.leases?.[0];

  if (!lease) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Kamar Saya
        </h1>

        <div className="mt-6 rounded-xl bg-white p-8 text-center shadow-sm">
          <DoorOpen size={40} className="mx-auto text-slate-400" />
          <p className="mt-4 text-slate-600">
            Kamu belum memiliki data sewa kamar.
          </p>
        </div>
      </div>
    );
  }

  const imageUrl = lease.room.imageUrl
    ? `${API_URL.replace(/\/api\/?$/, "")}${lease.room.imageUrl}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-slate-800">
          Kamar Saya
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Informasi kamar yang terhubung dengan akun kamu.
        </p>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          {/* Foto Kamar */}
          <div className="h-48 bg-slate-100 sm:h-56">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={lease.room.name}
                className="w-48 h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <ImageIcon size={45} />
                <p className="mt-2 text-sm">
                  Foto kamar belum tersedia
                </p>
              </div>
            )}
          </div>

          {/* Informasi Utama */}
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                  <DoorOpen size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {lease.room.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Kamar {lease.room.roomNumber}
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  lease.status === "ACTIVE"
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {{
                  ACTIVE: "Sewa Aktif",
                  COMPLETED: "Sewa Selesai",
                  TERMINATED: "Sewa Dihentikan",
                  CANCELLED: "Sewa Dibatalkan",
                }[lease.status] ?? lease.status}
              </span>
            </div>

          </div>

          {/* Detail Kamar */}
          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">
                Nomor Kamar
              </p>
              <p className="mt-1 font-semibold text-slate-800">
                {lease.room.roomNumber}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Tipe Kamar
              </p>
              <p className="mt-1 font-semibold text-slate-800">
                {lease.room.roomType.name}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-500">
                <Wallet size={16} />
                <p className="text-sm">Harga Per Bulan</p>
              </div>

              <p className="mt-1 font-semibold text-blue-600">
                {Number(lease.monthlyPrice).toLocaleString("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-500">
                <CalendarDays size={16} />
                <p className="text-sm">Periode Sewa</p>
              </div>

              <p className="mt-1 font-semibold text-slate-800">
                {new Date(lease.startDate).toLocaleDateString("id-ID")}
                {" - "}
                {new Date(lease.endDate).toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>
        </div>

        {/* Perpanjangan & pindah sewa */}
        <LeaseActions lease={lease} onChanged={fetchRoom} />
      </div>
    </div>
  );
}

export default MyRoom;
