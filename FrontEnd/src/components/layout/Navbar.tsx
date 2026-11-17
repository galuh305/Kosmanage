
import { Link } from 'react-router-dom'
import { House, LogIn } from 'lucide-react'

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 shadow-sm backdrop-blur-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <House size={25} strokeWidth={2.5} />
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Kos<span className="text-blue-600">Manage</span>
            </h1>
            <p className="text-[10px] font-medium tracking-widest text-slate-400">
              KOS MANAGEMENT SYSTEM
            </p>
          </div>
        </Link>

        {/* Menu Navigasi */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#beranda"
            className="font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Beranda
          </a>

          <a
            href="#kamar"
            className="font-medium text-slate-600 transition hover:text-blue-600"
          >
            Kamar
          </a>

          <a
            href="#fasilitas"
            className="font-medium text-slate-600 transition hover:text-blue-600"
          >
            Fasilitas
          </a>
        </div>

        {/* Tombol Login */}
        <Link
          to="/login"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          <LogIn size={18} />
          Login
        </Link>

      </nav>
    </header>
  )
}

export default Navbar
