import { useEffect, useState } from "react";
import { getRooms, type Room } from "../../services/room.service";
import { DoorOpen, RefreshCw, Search, Plus, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
  : "http://localhost:3000";

function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getRooms();
      setRooms(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil daftar kamar",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter((room) =>
    `${room.roomNumber} ${room.name} ${room.roomType.name}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const formatPrice = (price: number | string | null) => {
    if (price === null) return "-";

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  const statusStyle = {
    AVAILABLE: "bg-emerald-50 text-emerald-700",
    RESERVED: "bg-blue-50 text-blue-700",
    OCCUPIED: "bg-red-50 text-red-700",
    MAINTENANCE: "bg-amber-50 text-amber-700",
  } as const;

  const statusLabel = {
    AVAILABLE: "Tersedia",
    RESERVED: "Sudah Dipesan",
    OCCUPIED: "Terisi",
    MAINTENANCE: "Perbaikan",
  } as const;

  return (
    <section className="p-5 md:p-8">
      <div className="mb-6 flex items-center justify-end gap-3">
        <button
          onClick={fetchRooms}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Muat Ulang
        </button>

        <button
          onClick={() => navigate("/owner/rooms/create")}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={17} />
          Tambah Kamar
        </button>
      </div>

      {/* Ringkasan Kamar */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Kamar</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {rooms.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Kamar Tersedia</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {rooms.filter((room) => room.status === "AVAILABLE").length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Sudah Dipesan</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {rooms.filter((room) => room.status === "RESERVED").length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Kamar Terisi</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {rooms.filter((room) => room.status === "OCCUPIED").length}
          </p>
        </div>
      </div>

      {/* Daftar Kamar */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-800">Daftar Kamar</h2>
              <p className="mt-1 text-xs text-slate-400">
                Informasi seluruh kamar yang terdaftar.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nomor atau nama kamar..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Memuat daftar kamar...
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchRooms}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              Coba lagi
            </button>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-12 text-center">
            <DoorOpen size={36} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-600">
              Kamar tidak ditemukan
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Belum ada kamar atau kata kunci pencarian tidak cocok.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Foto</th>
                  <th className="px-5 py-4">Kamar</th>
                  <th className="px-5 py-4">Tipe Kamar</th>
                  <th className="px-5 py-4">Harga / Bulan</th>
                  <th className="px-5 py-4">Fasilitas</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      {room.imageUrl ? (
                        <img
                          src={`${API_BASE_URL}${room.imageUrl}`}
                          alt={`Foto ${room.name}`}
                          className="h-14 w-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-slate-100 text-2xl">
                          🏠
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {room.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        No. {room.roomNumber}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {room.roomType.name}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {formatPrice(room.price ?? room.roomType.basePrice)}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {room.facilities.length > 0
                        ? room.facilities
                            .map((item) => item.facility.name)
                            .join(", ")
                        : "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle[room.status]}`}
                      >
                        {statusLabel[room.status]}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/owner/rooms/${room.id}/edit`)
                          }
                          className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default Rooms;
