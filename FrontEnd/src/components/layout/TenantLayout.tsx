
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

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className="border-b border-slate-200 px-6 py-6">
        <h1 className="text-2xl font-bold text-blue-600">KosManage</h1>
        <p className="mt-1 text-xs text-slate-400">
          Halaman Penyewa Portal
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">
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
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                  isActive
                    ? "bg-blue-50 font-medium text-blue-600"
                    : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                }`
              }
            >
              <Icon size={19} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-red-500 transition hover:bg-red-50"
        >
          <LogOut size={19} />
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
            className="absolute inset-0 bg-black/40"
            aria-label="Tutup menu"
          />

          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-end px-4 pt-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
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
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <SidebarContent />
      </aside>

      {/* Konten Utama */}
      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Buka menu"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {pageTitle}
              </h2>
              <p className="text-xs text-slate-400">
                Tenant Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-slate-500">
              <Bell size={20} />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <UserRound size={19} />
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-700">
                  {user?.name || "Tenant"}
                </p>
                <p className="text-xs text-slate-400">Penghuni Kos</p>
              </div>
            </div>
          </div>
        </header>

        <div className="min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default TenantLayout;
