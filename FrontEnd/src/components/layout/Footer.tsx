
import { Link } from 'react-router-dom'
import {
  House,
  MapPin,
  Mail,
  Phone,
  ArrowUpRight,
} from 'lucide-react'

function Footer() {
  return (
    <footer className="bg-slate-950 text-white">

      <div className="mx-auto max-w-7xl px-6 py-16">

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                <House size={26} />
              </div>

              <span className="text-2xl font-extrabold">
                Kos<span className="text-blue-500">Manage</span>
              </span>
            </Link>

            <p className="mt-6 max-w-md text-sm leading-8 text-slate-400">
              KosManage merupakan sistem informasi manajemen kos
              yang membantu pengunjung mendapatkan informasi kamar
              dan memudahkan pengelola dalam mengatur operasional kos.
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
              <MapPin size={18} className="text-blue-500" />
              Kota Padang, Sumatera Barat
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-bold">
              Navigasi
            </h3>

            <ul className="mt-6 space-y-4 text-sm text-slate-400">
              <li>
                <a href="#beranda" className="transition hover:text-blue-400">
                  Beranda
                </a>
              </li>

              <li>
                <a href="#kamar" className="transition hover:text-blue-400">
                  Daftar Kamar
                </a>
              </li>

              <li>
                <a href="#fasilitas" className="transition hover:text-blue-400">
                  Fasilitas
                </a>
              </li>

              <li>
                <Link to="/login" className="transition hover:text-blue-400">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h3 className="text-lg font-bold">
              Informasi
            </h3>

            <ul className="mt-6 space-y-5 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="shrink-0 text-blue-500" />
                <span>Kota Padang, Sumatera Barat</span>
              </li>

              <li className="flex items-start gap-3">
                <Mail size={18} className="shrink-0 text-blue-500" />
                <span>Informasi kontak melalui pengelola kos</span>
              </li>

              <li className="flex items-start gap-3">
                <Phone size={18} className="shrink-0 text-blue-500" />
                <span>Hubungi pengelola untuk pemesanan</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-14 flex flex-col justify-between gap-4 border-t border-slate-800 pt-8 text-sm text-slate-500 md:flex-row md:items-center">

          <p>
            © {new Date().getFullYear()} KosManage. All rights reserved.
          </p>

          <Link
            to="/login"
            className="flex items-center gap-2 transition hover:text-blue-400"
          >
            Masuk sebagai pengelola
            <ArrowUpRight size={16} />
          </Link>

        </div>

      </div>
    </footer>
  )
}

export default Footer
