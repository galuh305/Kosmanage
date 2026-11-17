import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/public/Home";
import Login from "../pages/Login";
import RoomDetail from "../pages/public/RoomDetail";
import Booking from "../pages/public/Booking";

import Dashboard from "../pages/owner/Dashboard";
import Rooms from "../pages/owner/Rooms";
import CreateRoom from "../pages/owner/CreateRoom";
import OwnerRoute from "./OwnerRoute";
import OwnerLayout from "../components/layout/OwnerLayout";
import Bookings from "../pages/owner/Bookings";
import ActivateAccount from "../pages/ActivateAccount";
import TenantDashboard from "../pages/tenant/Dashboard";
import EditRoom from "../pages/owner/EditRoom";
import OwnerPayment from "../pages/owner/OwnerPayment";
import OwnerMaintenance from "../pages/owner/OwnerMaintenance";
import LeaseRequests from "../pages/owner/LeaseRequests";

import TenantLayout from "../components/layout/TenantLayout";
import TenantRoute from "./TenantRoute";
import MyRoom from "../pages/tenant/MyRoom";
import Invoices from '../pages/tenant/Invoices'
import Payments from "../pages/tenant/Payments";
import MyMaintenance from "../pages/tenant/MyMaintenance";
import Settings from "../pages/tenant/Settings";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman publik */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/activate" element={<ActivateAccount />} />
        <Route path="/kamar/:id" element={<RoomDetail />} />
        <Route path="/pemesanan/:id" element={<Booking />} />

        {/* Halaman Owner dengan layout bersama */}
        <Route
          path="/owner"
          element={
            <OwnerRoute>
              <OwnerLayout />
            </OwnerRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/create" element={<CreateRoom />} />
          <Route path="rooms/:id/edit" element={<EditRoom />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="payments" element={<OwnerPayment />} />
          <Route path="maintenance" element={<OwnerMaintenance />} />
          <Route path="lease-requests" element={<LeaseRequests />} />

        </Route>

        {/* Halaman Tenant */}
        <Route
          path="/tenant"
          element={
            <TenantRoute>
              <TenantLayout />
            </TenantRoute>
          }
        >
          <Route index element={<TenantDashboard />} />
          <Route path="room" element={<MyRoom />} />
          <Route path="/tenant/invoices" element={<Invoices />} />
          <Route path="payments" element={<Payments />} />
          <Route path="maintenance" element={<MyMaintenance />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Halaman tidak ditemukan */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
