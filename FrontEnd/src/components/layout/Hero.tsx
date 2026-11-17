
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Zap,
  Headset,
  MapPin,
  Users,
} from 'lucide-react'

function Hero() {
  return (
    <section
      id="beranda"
      className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-100"
    >
      {/* Dekorasi background */}
      <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">

        {/* Konten kiri */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            <MapPin size={16} />
            Sistem Informasi Manajemen Kos
          </div>

          <h1 className="mt-7 text-4xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Temukan Kamar Kos
            <span className="block text-blue-600">
              yang Tepat
            </span>
            untuk Kebutuhanmu
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            Cari informasi kamar, lihat fasilitas, dan ajukan
            pemesanan kos dengan lebih mudah melalui KosManage.
          </p>

          {/* Tombol */}
          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="#kamar"
              className="group flex items-center gap-3 rounded-xl bg-blue-600 px-7 py-4 font-semibold text-white shadow-xl shadow-blue-200 transition duration-300 hover:-translate-y-1 hover:bg-blue-700"
            >
              <Search size={19} />
              Lihat Kamar
              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </a>

            <Link
              to="/login"
              className="rounded-xl border border-slate-200 bg-white px-7 py-4 font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
            >
              Masuk Akun
            </Link>
          </div>

          {/* Keunggulan */}
          <div className="mt-12 grid grid-cols-3 gap-4 border-t border-blue-100 pt-8">
            <div>
              <Zap size={25} className="text-blue-600" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">
                Praktis
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Pengajuan mudah
              </p>
            </div>

            <div>
              <ShieldCheck size={25} className="text-blue-600" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">
                Terpercaya
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Informasi jelas
              </p>
            </div>

            <div>
              <Headset size={25} className="text-blue-600" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">
                Responsif
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Layanan mudah
              </p>
            </div>
          </div>
        </div>

        {/* Gambar kanan */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-blue-200/40 blur-2xl" />

          <div className="relative overflow-hidden rounded-[2rem] border-8 border-white shadow-2xl">
            <img
              src="../../../public/kos.jpg"
              alt="Bangunan kos KosManage"
              className="h-[350px] w-full object-cover sm:h-[450px] lg:h-[500px]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
          </div>

          {/* Informasi mengambang */}
          <div className="absolute -bottom-7 -left-5 flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-xl sm:-left-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Users size={25} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Pengelolaan hunian
              </p>
              <h3 className="font-bold text-slate-800">
                Lebih Mudah & Praktis
              </h3>
            </div>
          </div>

          <div className="absolute -right-3 top-8 rounded-xl bg-white px-4 py-3 shadow-lg sm:-right-5">
            <p className="text-xs font-semibold text-blue-600">
              KosManage
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              Your Comfortable Stay
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}

export default Hero
