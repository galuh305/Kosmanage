
import {
  BedDouble,
  Wind,
  Wifi,
  Bath,
  CarFront,
  ShieldCheck,
  Zap,
  Coffee,
} from 'lucide-react'

const facilities = [
  {
    icon: BedDouble,
    name: 'Tempat Tidur',
    description: 'Kamar dilengkapi tempat tidur yang nyaman untuk beristirahat.',
  },
  {
    icon: Wind,
    name: 'Pendingin Ruangan',
    description: 'Pilihan kamar dengan fasilitas AC untuk kenyamanan penghuni.',
  },
  {
    icon: Wifi,
    name: 'WiFi',
    description: 'Akses internet untuk mendukung aktivitas sehari-hari.',
  },
  {
    icon: Bath,
    name: 'Kamar Mandi',
    description: 'Fasilitas kamar mandi untuk kebutuhan penghuni.',
  },
  {
    icon: CarFront,
    name: 'Area Parkir',
    description: 'Area parkir untuk kendaraan penghuni kos.',
  },
  {
    icon: ShieldCheck,
    name: 'Keamanan',
    description: 'Lingkungan kos yang memperhatikan keamanan penghuni.',
  },
  {
    icon: Zap,
    name: 'Listrik',
    description: 'Fasilitas listrik untuk kebutuhan sehari-hari.',
  },
  {
    icon: Coffee,
    name: 'Area Bersama',
    description: 'Ruang bersama untuk bersantai dan berinteraksi.',
  },
]

function FacilitySection() {
  return (
    <section
      id="fasilitas"
      className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-50 px-6 py-24"
    >
      <div className="absolute -right-32 top-0 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
            FASILITAS KOS
          </span>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Kenyamanan untuk
            <span className="text-blue-600"> Setiap Penghuni</span>
          </h2>

          <p className="mt-5 leading-8 text-slate-600">
            Berbagai fasilitas yang disediakan untuk mendukung
            kenyamanan dan kebutuhan penghuni selama tinggal di kos.
          </p>
        </div>

        {/* Facility Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((facility) => {
            const Icon = facility.icon

            return (
              <div
                key={facility.name}
                className="group rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition duration-300 group-hover:bg-blue-600 group-hover:text-white">
                  <Icon size={27} strokeWidth={1.8} />
                </div>

                <h3 className="mt-6 text-lg font-bold text-slate-900">
                  {facility.name}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {facility.description}
                </p>

                <div className="mt-5 h-1 w-10 rounded-full bg-blue-200 transition-all duration-300 group-hover:w-20 group-hover:bg-blue-600" />
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default FacilitySection
