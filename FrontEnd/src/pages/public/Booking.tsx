import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { getRooms, type Room } from "../../services/room.service";
import { createBooking } from "../../services/booking.service";

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    startDate: "",
    endDate: "",
    message: "",
  });

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const rooms = await getRooms();

        const selectedRoom = rooms.find((item) => item.id === Number(id));

        if (!selectedRoom) {
          setError("Kamar tidak ditemukan");
          return;
        }

        setRoom(selectedRoom);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal mengambil data kamar",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "startDate" && prev.endDate && value >= prev.endDate
        ? { endDate: "" }
        : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!room) return;

    if (room.status !== "AVAILABLE") {
      alert("Maaf, kamar ini sedang tidak tersedia.");
      return;
    }

    const phoneRegex = /^08[0-9]{8,11}$/;

    if (!phoneRegex.test(form.phone)) {
      alert("Nomor HP harus diawali 08 dan berisi 10-13 digit.");
      return;
    }

    if (form.endDate <= form.startDate) {
      alert("Tanggal selesai harus setelah tanggal mulai.");
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await createBooking({
        roomId: room.id,
        guestName: form.name,
        guestEmail: form.email,
        guestPhone: form.phone,
        startDate: form.startDate,
        endDate: form.endDate,
        message: form.message.trim() || undefined,
      });

      alert(result.pesan);

      navigate("/", { replace: true });
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengajukan pemesanan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Memuat data kamar...</p>
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

          <Link to="/" className="mt-4 inline-block text-blue-600">
            Kembali ke halaman utama
          </Link>
        </div>
      </main>
    );
  }

  if (room.status !== "AVAILABLE") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            Kamar Tidak Tersedia
          </h1>

          <p className="mt-2 text-slate-500">
            Kamar ini tidak dapat menerima pengajuan pemesanan.
          </p>

          <Link
            to={`/kamar/${room.id}`}
            className="mt-4 inline-block text-blue-600"
          >
            Kembali ke detail kamar
          </Link>
        </div>
      </main>
    );
  }

  const roomPrice = Number(room.price ?? room.roomType.basePrice);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          to={`/kamar/${room.id}`}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Kembali ke detail kamar
        </Link>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-blue-600 p-8 text-white">
            <div className="flex items-center gap-3">
              <CalendarDays size={28} />

              <div>
                <h1 className="text-2xl font-bold">Pengajuan Pemesanan</h1>

                <p className="mt-1 text-sm text-blue-100">
                  Lengkapi data berikut untuk mengajukan kamar.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8 rounded-xl bg-blue-50 p-5">
              <p className="text-sm text-slate-500">Kamar yang dipilih</p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {room.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Nomor kamar: {room.roomNumber}
              </p>

              <p className="mt-2 font-bold text-blue-600">
                Rp{roomPrice.toLocaleString("id-ID")} / bulan
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <UserRound size={20} />
                  Data Calon Penghuni
                </h2>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nama Lengkap
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contoh@email.com"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nomor HP / WhatsApp
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Rencana Tanggal Masuk
                </label>

                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  min={minDate}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Rencana Tanggal Selesai
                </label>

                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  min={form.startDate || minDate}
                  required
                  disabled={!form.startDate}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              {/* Pesan Tambahan */}
              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Pesan Tambahan
                  <span className="ml-1 font-normal text-slate-400">
                    (Opsional)
                  </span>
                </label>

                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder="Tuliskan pesan atau informasi tambahan..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Mengirim Pengajuan..." : "Kirim Pengajuan"}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                Pengajuan akan diteruskan kepada pemilik kos untuk diperiksa.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
