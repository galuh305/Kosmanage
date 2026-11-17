
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getRooms, type Room } from "../../services/room.service";

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
  : "http://localhost:3000";

export default function RoomDetail() {
  const { id } = useParams();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const rooms = await getRooms();

        const selectedRoom = rooms.find(
          (item) => item.id === Number(id)
        );

        if (!selectedRoom) {
          setError("Kamar tidak ditemukan");
          return;
        }

        setRoom(selectedRoom);
        setImageError(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data kamar"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Memuat detail kamar...</p>
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {error || "Kamar tidak ditemukan"}
          </h1>

          <p className="mt-2 text-slate-500">
            Data kamar yang kamu cari tidak tersedia.
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Kembali ke halaman utama
          </Link>
        </div>
      </main>
    );
  }

  const roomPrice = Number(room.price ?? room.roomType.basePrice);
  const isAvailable = room.status === "AVAILABLE";

  const imageSrc = room.imageUrl
    ? `${API_BASE_URL}${room.imageUrl}`
    : null;

  const statusConfig = {
    AVAILABLE: {
      label: "Tersedia",
      style: "bg-emerald-50 text-emerald-700",
    },
    RESERVED: {
      label: "Sudah Dipesan",
      style: "bg-blue-50 text-blue-700",
    },
    OCCUPIED: {
      label: "Terisi",
      style: "bg-red-50 text-red-700",
    },
    MAINTENANCE: {
      label: "Maintenance",
      style: "bg-amber-50 text-amber-700",
    },
  } as const;

  const status = statusConfig[room.status];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Kembali ke daftar kamar
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gambar Kamar */}
          <div className="flex h-[350px] items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm sm:h-[450px]">
            {imageSrc && !imageError ? (
              <img
                src={imageSrc}
                alt={`Foto ${room.name}`}
                onError={() => setImageError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-center text-slate-300">
                <div className="text-7xl">🏠</div>
                <p className="mt-3 text-sm">
                  Kamar {room.roomNumber}
                </p>
              </div>
            )}
          </div>

          {/* Informasi Kamar */}
          <div className="rounded-2xl bg-white p-7 shadow-sm sm:p-9">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                {room.roomType.name}
              </span>

              <span
                className={`rounded-lg px-3 py-2 text-xs font-bold ${status.style}`}
              >
                {status.label}
              </span>
            </div>

            <h1 className="mt-6 text-3xl font-extrabold text-slate-900">
              {room.name}
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-400">
              Nomor Kamar: {room.roomNumber}
            </p>

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <MapPin size={18} />
              Kota Padang, Sumatera Barat
            </div>

            <div className="mt-8 border-y border-slate-100 py-6">
              <p className="text-sm text-slate-400">
                Harga sewa per bulan
              </p>

              <p className="mt-2 text-3xl font-extrabold text-blue-600">
                Rp{roomPrice.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="mt-7">
              <h2 className="text-lg font-bold text-slate-900">
                Deskripsi Kamar
              </h2>

              <p className="mt-3 leading-7 text-slate-500">
                {room.description ||
                  "Belum ada deskripsi untuk kamar ini."}
              </p>
            </div>

            <div className="mt-7">
              <h2 className="text-lg font-bold text-slate-900">
                Fasilitas Kamar
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-4">
                {room.facilities.length > 0 ? (
                  room.facilities.map((item) => (
                    <div
                      key={item.facility.id}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <Check
                        size={17}
                        className="shrink-0 text-emerald-500"
                      />
                      {item.facility.name}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Belum ada fasilitas kamar.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <ShieldCheck
                className="shrink-0 text-blue-600"
                size={24}
              />

              <p className="text-sm text-slate-600">
                Informasi kamar ditampilkan untuk membantu calon
                penghuni sebelum mengajukan pemesanan.
              </p>
            </div>

            {isAvailable ? (
              <Link
                to={`/pemesanan/${room.id}`}
                className="mt-8 block w-full rounded-xl bg-blue-600 py-4 text-center font-bold text-white transition hover:bg-blue-700"
              >
                Ajukan Pemesanan
              </Link>
            ) : (
              <div className="mt-8 rounded-xl bg-slate-100 py-4 text-center text-sm font-semibold text-slate-500">
                Kamar belum tersedia untuk dipesan
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
