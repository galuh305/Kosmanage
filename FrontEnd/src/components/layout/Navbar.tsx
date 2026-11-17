import { Link } from 'react-router-dom'
import { House, LogIn } from 'lucide-react'

function Navbar() {
  const linkBase =
    "relative py-1 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-blue-600 after:transition-transform after:duration-300 hover:after:scale-x-100"

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">

        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-200 transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-105">
            <House size={22} strokeWidth={2.4} />
          </div>

          <div>
            <h1 className="text-lg leading-none font-extrabold tracking-tight text-slate-900">
              Kos<span className="text-blue-600">Manage</span>
            </h1>
            <p className="mt-1 text-[10px] font-medium tracking-[0.18em] text-slate-400">
              KOS MANAGEMENT SYSTEM
            </p>
          </div>
        </Link>

        {/* Menu Navigasi */}
        <div className="hidden items-center gap-9 md:flex">
          <a
            href="#beranda"
            className="relative py-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-blue-600"
          >
            Beranda
          </a>

          <a href="#kamar" className={linkBase}>
            Kamar
          </a>

          <a href="#fasilitas" className={linkBase}>
            Fasilitas
          </a>
        </div>

        {/* Tombol Login */}
        <Link
          to="/login"
          className="group flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200"
        >
          <LogIn
            size={17}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
          Login
        </Link>

      </nav>
    </header>
  )
}

export default Navbar
