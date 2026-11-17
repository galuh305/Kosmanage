
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  DoorOpen,
  LogOut,
  Menu,
  Bell,
  ReceiptText,
  CircleDollarSign,
  Wallet,
  UserRound,
  Wrench,
  X,
  Settings,
  House,
} from "lucide-react";
import { useState } from "react";

import { logout, getStoredUser } from "../../services/auth.service";

function TenantLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    {
      label: "Dashboard",
      path: "/tenant",
      icon: LayoutDashboard,
    },
     {
    label: "Kamar Saya",
    path: "/tenant/room",
    icon: DoorOpen,
  },
  {
    label: "Tagihan Saya",
    path: "/tenant/invoices",
    icon: ReceiptText,
  },
  {
    label: "Pembayaran saya",
    path: "/tenant/payments",
    icon: CircleDollarSign,
  },
  {
  label: "Keluhan Saya",
  path: "/tenant/maintenance",
  icon: Wrench,
},
{
  label: "Pengaturan Akun",
  path: "/tenant/settings",
  icon: Settings,
},
  ];

  const pageTitles: Record<string, string> = {
    "/tenant": "Dashboard Tenant",
    "/tenant/room": "Kamar Saya",
    "/tenant/invoices": "Tagihan Saya",
    "/tenant/payments": "Pembayaran Saya",
    "/tenant/maintenance": "Keluhan Saya",
    "/tenant/settings": "Pengaturan Akun",

  };

  const pageTitle = pageTitles[location.pathname] || "Dashboard Tenant";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
      isActive
        ? "bg-blue-50 font-semibold text-blue-700 before:absolute before:top-1/2 before:left-0 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-blue-600"
        : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`;

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-200">
            <House size={21} strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="text-lg leading-none font-extrabold tracking-tight text-slate-900">
              Kos<span className="text-blue-600">Manage</span>
            </h1>
            <p className="mt-1 text-[11px] text-slate-400">Halaman Penyewa Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={() => {
                if (mobile) setSidebarOpen(false);
              }}
              className={navLinkClass}
            >
              <Icon size={19} className="transition-transform duration-200 group-hover:scale-110" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50"
        >
          <LogOut size={19} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          Keluar
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            onClick={() => setSidebarOpen(false)}
            className="animate-fade-in absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            aria-label="Tutup menu"
          />

          <aside className="animate-slide-in-left absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-end px-4 pt-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Tutup menu"
              >
                <X size={22} />
              </button>
            </div>

            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white md:sticky md:top-0 md:flex md:h-screen">
        <SidebarContent />
      </aside>

      {/* Konten Utama */}
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-5 py-3.5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Buka menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                {pageTitle}
              </h2>
              <p className="text-xs text-slate-400">
                Tenant Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="Notifikasi"
            >
              <Bell size={20} />
            </button>

            <div className="flex items-center gap-2.5 rounded-full py-1 pr-1 pl-1 sm:pr-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm">
                <UserRound size={18} />
              </div>

              <div className="hidden sm:block">
                <p className="text-sm leading-tight font-semibold text-slate-800">
                  {user?.name || "Tenant"}
                </p>
                <p className="text-xs text-slate-400">Penghuni Kos</p>
              </div>
            </div>
          </div>
        </header>

        <div className="page-enter min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default TenantLayout;
