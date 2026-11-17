import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  BedDouble,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
} from "lucide-react";

import { getRooms, type Room } from "../../services/room.service";
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
  : "http://localhost:3000";

function RoomSection() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getRooms();
        setRooms(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal mengambil data kamar.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const roomTypes = Array.from(
    new Set(rooms.map((room) => room.roomType.name)),
  );

  const filteredRooms = rooms.filter((room) => {
    const roomType = room.roomType.name;

    const matchSearch =
      room.name.toLowerCase().includes(search.toLowerCase()) ||
      room.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      roomType.toLowerCase().includes(search.toLowerCase());

    const matchType = selectedType === "Semua" || roomType === selectedType;

    const matchStatus =
      selectedStatus === "Semua" || room.status === selectedStatus;

    return matchSearch && matchType && matchStatus;
  });

  const formatPrice = (price: number | string) => {
    return Number(price).toLocaleString("id-ID");
  };

  const getStatusLabel = (status: Room["status"]) => {
    switch (status) {
      case "AVAILABLE":
        return "Tersedia";
      case "RESERVED":
        return "Sudah Dipesan";
      case "OCCUPIED":
        return "Terisi";
      case "MAINTENANCE":
        return "Maintenance";
      default:
        return status;
    }
  };

  const getStatusStyle = (status: Room["status"]) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-500 text-white";
      case "RESERVED":
        return "bg-blue-500 text-white";
      case "OCCUPIED":
        return "bg-red-500 text-white";
      case "MAINTENANCE":
        return "bg-amber-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  return (
    <section id="kamar" className="bg-slate-50 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-14 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold tracking-widest text-blue-600">
              <span className="h-1 w-8 rounded-full bg-blue-600" />
              PILIHAN KAMAR
            </div>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Temukan Kamar
              <span className="text-blue-600"> Favoritmu</span>
            </h2>

            <p className="mt-4 max-w-xl leading-7 text-slate-500">
              Pilihan kamar dengan tipe, fasilitas, dan harga yang dapat
              disesuaikan dengan kebutuhanmu.
            </p>
          </div>

          <div className="text-sm text-slate-500">Pilihan kamar KosManage</div>
        </div>

        {/* Search and Filter */}
        <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="relative md:col-span-1">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Cari nama atau tipe kamar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Filter Tipe */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="Semua">Semua Tipe Kamar</option>

              {roomTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="Semua">Semua Status</option>
              <option value="AVAILABLE">Tersedia</option>
              <option value="RESERVED">Sudah Dipesan</option>
              <option value="OCCUPIED">Terisi</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="py-16 text-center text-slate-500">
            Sedang mengambil data kamar...
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            {error}
          </div>
        )}

        {/* Room Cards */}
        {!isLoading && !error && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => {
              const price = Number(room.price ?? room.roomType.basePrice);

              return (
                <Link
                  to={`/kamar/${room.id}`}
                  key={room.id}
                  className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  {/* Image Placeholder */}
                  {/* Room Image */}
                  <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-100 to-slate-200">
                    {room.imageUrl ? (
                      <img
                        src={`${API_BASE_URL}${room.imageUrl}`}
                        alt={`Foto ${room.name}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BedDouble
                          size={76}
                          className="text-blue-300 transition duration-500 group-hover:scale-110"
                        />
                      </div>
                    )}

                    <div className="absolute left-4 top-4 rounded-lg bg-white px-3 py-2 text-xs font-bold tracking-wide text-blue-700 shadow">
                      {room.roomType.name}
                    </div>

                    <div
                      className={`absolute right-4 top-4 rounded-lg px-3 py-2 text-xs font-bold ${getStatusStyle(
                        room.status,
                      )}`}
                    >
                      {getStatusLabel(room.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          NOMOR KAMAR {room.roomNumber}
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-slate-900">
                          {room.name}
                        </h3>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <BedDouble size={21} />
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-5 border-b border-slate-100 pb-5">
                      <p className="text-sm text-slate-400">Harga sewa</p>

                      <p className="mt-1 text-2xl font-extrabold text-blue-600">
                        Rp{formatPrice(price)}
                        <span className="text-sm font-medium text-slate-400">
                          {" "}
                          / bulan
                        </span>
                      </p>
                    </div>

                    {/* Facilities */}
                    <div className="mt-5">
                      <p className="mb-4 text-sm font-bold text-slate-800">
                        Fasilitas kamar
                      </p>

                      <div className="space-y-3">
                        {room.facilities.length > 0 ? (
                          room.facilities.map((item) => (
                            <div
                              key={item.facility.id}
                              className="flex items-center gap-3 text-sm text-slate-600"
                            >
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <Check size={13} strokeWidth={3} />
                              </div>

                              {item.facility.name}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400">
                            Belum ada fasilitas terdaftar.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom */}
                    <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
                      <span className="text-xs font-medium text-slate-400">
                        Informasi kamar
                      </span>

                      <span className="flex items-center gap-2 text-sm font-bold text-blue-600">
                        {room.status === "AVAILABLE"
                          ? "Siap dihuni"
                          : "Tidak tersedia"}

                        <ArrowUpRight size={17} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {filteredRooms.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <SlidersHorizontal
                  size={40}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 text-lg font-bold text-slate-700">
                  Kamar tidak ditemukan
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Coba gunakan kata kunci atau filter yang berbeda.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default RoomSection;
