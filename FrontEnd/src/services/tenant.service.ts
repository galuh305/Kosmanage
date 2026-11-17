import API_URL from "../config/api";
import type { LeaseExtension, LeaseTermination } from "./lease.service";

// Tipe data kamar
export type TenantRoom = {
  id: number;
  roomNumber: string;
  name: string;
  imageUrl?: string | null;
  roomType: {
    id: number;
    name: string;
  };
};

// Tipe data lease
export type TenantLease = {
  id: number;
  userId: number;
  roomId: number;
  startDate: string;
  endDate: string;
  monthlyPrice: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "TERMINATED";
  room: TenantRoom;
  extensions?: LeaseExtension[];
  terminations?: LeaseTermination[];
};

// Tipe data Dashboard Tenant
export type TenantDashboard = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  leases: TenantLease[];
};

export type CreatePaymentInput = {
  invoiceId: number;
  proof: File;
};

export const getTenantDashboard = async (): Promise<TenantDashboard> => {
  const token = localStorage.getItem("kosmanage_token");

  const response = await fetch(`${API_URL}/tenant/dashboard`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Gagal mengambil data Tenant");
  }

  return result.data;
};

export type Payment = {
  id: number;
  invoiceId: number;
  amount: string;
  paymentMethod: string;
  transactionStatus:
    | "PENDING_VERIFICATION"
    | "APPROVED"
    | "REJECTED";
  proofUrl: string;
  ownerNote: string | null;
  paidAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

export const createPayment = async ({
  invoiceId,
  proof,
}: CreatePaymentInput): Promise<Payment> => {
  const token = localStorage.getItem("kosmanage_token");

  const formData = new FormData();
  formData.append("invoiceId", String(invoiceId));
  formData.append("proof", proof);

  const response = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Gagal mengajukan pembayaran");
  }

  return result.data;
};

export const getPayments = async (): Promise<Payment[]> => {
  const token = localStorage.getItem("kosmanage_token");

  const response = await fetch(`${API_URL}/payments`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Gagal mengambil data pembayaran");
  }

  return result.data;
};
