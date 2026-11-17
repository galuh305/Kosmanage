import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  DoorOpen,
  ClipboardList,
  CreditCard,
  CalendarPlus,
  Settings,
  LogOut,
  Menu,
  Bell,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { logout, getStoredUser } from "../../services/auth.service";

function OwnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    {
      label: "Dashboard",
      path: "/owner/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Kamar",
      path: "/owner/rooms",
      icon: DoorOpen,
    },
    {
      label: "Pemesanan",
      path: "/owner/bookings",
      icon: ClipboardList,
    },
    {
      label: "Pembayaran",
      path: "/owner/payments",
      icon: CreditCard,
    },
    {
      label: "Perpanjang & Pindah",
      path: "/owner/lease-requests",
      icon: CalendarPlus,
    },
     {
      label: "Keluhan Tenant",
      path: "/owner/maintenance",
      icon: Wrench,
    },
    {
      label: "Pengaturan",
      path: "/owner/settings",
      icon: Settings,
    },
  ];

  const pageTitles: Record<string, string> = {
    "/owner/dashboard": "Dashboard",
    "/owner/rooms": "Manajemen Kamar",
    "/owner/rooms/create": "Tambah Kamar",
    "/owner/bookings": "Manajemen Pemesanan",
    "/owner/payments": "Manajemen Pembayaran",
    "/owner/maintenance": "Keluhan Tenant",
    "/owner/lease-requests": "Perpanjangan & Pindah",
    "/owner/settings": "Pengaturan",
  };

  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Overlay dan sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Tutup menu"
          />

          {/* Panel sidebar */}
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-6">
              <div>
                <h1 className="text-2xl font-bold text-blue-600">KosManage</h1>
                <p className="mt-1 text-xs text-slate-400">
                  Property Management System
                </p>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Tutup menu"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="flex-1 space-y-2 p-4">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/owner/dashboard"}
                    onClick={() => setSidebarOpen(false)}
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
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-500 transition hover:bg-red-50"
              >
                <LogOut size={19} />
                Keluar
              </button>
            </div>
          </aside>
        </div>
      )}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-200 px-6 py-6">
          <h1 className="text-2xl font-bold text-blue-600">KosManage</h1>
          <p className="mt-1 text-xs text-slate-400">
            Property Management System
          </p>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/owner/dashboard"}
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
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-red-500 hover:bg-red-50"
          >
            <LogOut size={19} />
            Keluar
          </button>
        </div>
      </aside>

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
                Property Management System
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
                  {user?.name || "Owner"}
                </p>
                <p className="text-xs text-slate-400">Administrator</p>
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

export default OwnerLayout;
