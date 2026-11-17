import API_URL from "../config/api";

/* ------------------------------ Tipe data ------------------------------ */

export type LeaseExtensionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export type LeaseTerminationStatus = LeaseExtensionStatus;

export type LeaseExtension = {
  id: number;
  leaseId: number;
  invoiceId: number | null;
  requestedMonths: number;
  requestedEndDate: string;
  approvedEndDate: string | null;
  tenantNote: string | null;
  ownerNote: string | null;
  status: LeaseExtensionStatus;
  approvedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  invoice?: {
    id: number;
    invoiceNumber: string;
    amount: string | number;
    status: "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED";
    dueDate: string;
  } | null;
};

export type LeaseTermination = {
  id: number;
  leaseId: number;
  requestedMoveOutDate: string;
  actualMoveOutDate: string | null;
  reason: string;
  tenantNote: string | null;
  ownerNote: string | null;
  refundAmount: string | number | null;
  deductionAmount: string | number | null;
  status: LeaseTerminationStatus;
  approvedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

// Data tambahan yang dipakai halaman owner
type LeaseOwnerInfo = {
  lease: {
    id: number;
    startDate: string;
    endDate: string;
    monthlyPrice: string | number;
    user: {
      id: number;
      name: string;
      email: string;
      phone: string | null;
    };
    room: { id: number; roomNumber: string; name: string };
  };
};

export type OwnerLeaseExtension = LeaseExtension & LeaseOwnerInfo;
export type OwnerLeaseTermination = LeaseTermination & LeaseOwnerInfo;

export type LeaseRequests = {
  extensions: OwnerLeaseExtension[];
  terminations: OwnerLeaseTermination[];
};

/* ------------------------------ Helper API ----------------------------- */

const request = async <T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
  fallbackMessage: string
): Promise<T> => {
  const token = localStorage.getItem("kosmanage_token");

  const response = await fetch(`${API_URL}/leases${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.pesan || fallbackMessage);
  }

  return result.data as T;
};

/* -------------------------------- Tenant ------------------------------- */

export const requestLeaseExtension = (
  leaseId: number,
  input: { months: number; tenantNote?: string }
) =>
  request<LeaseExtension>(
    `/${leaseId}/extensions`,
    { method: "POST", body: input },
    "Gagal mengajukan perpanjangan sewa"
  );

export const cancelLeaseExtension = (extensionId: number) =>
  request<LeaseExtension>(
    `/extensions/${extensionId}/cancel`,
    { method: "PATCH" },
    "Gagal membatalkan perpanjangan sewa"
  );

export const requestLeaseTermination = (
  leaseId: number,
  input: {
    requestedMoveOutDate: string; // YYYY-MM-DD
    reason: string;
    tenantNote?: string;
  }
) =>
  request<LeaseTermination>(
    `/${leaseId}/terminations`,
    { method: "POST", body: input },
    "Gagal mengajukan pindah sewa"
  );

export const cancelLeaseTermination = (terminationId: number) =>
  request<LeaseTermination>(
    `/terminations/${terminationId}/cancel`,
    { method: "PATCH" },
    "Gagal membatalkan pengajuan pindah"
  );

/* --------------------------------- Owner ------------------------------- */

export const getLeaseRequests = () =>
  request<LeaseRequests>(
    "/requests",
    {},
    "Gagal mengambil pengajuan perpanjangan dan pindah"
  );

export const approveLeaseExtension = (id: number, ownerNote?: string) =>
  request<LeaseExtension>(
    `/extensions/${id}/approve`,
    { method: "PATCH", body: { ownerNote } },
    "Gagal menyetujui perpanjangan"
  );

export const rejectLeaseExtension = (id: number, ownerNote: string) =>
  request<LeaseExtension>(
    `/extensions/${id}/reject`,
    { method: "PATCH", body: { ownerNote } },
    "Gagal menolak perpanjangan"
  );

export const approveLeaseTermination = (
  id: number,
  input: {
    ownerNote?: string;
    actualMoveOutDate?: string;
    refundAmount?: number;
    deductionAmount?: number;
  }
) =>
  request<LeaseTermination>(
    `/terminations/${id}/approve`,
    { method: "PATCH", body: input },
    "Gagal menyetujui pengajuan pindah"
  );

export const rejectLeaseTermination = (id: number, ownerNote: string) =>
  request<LeaseTermination>(
    `/terminations/${id}/reject`,
    { method: "PATCH", body: { ownerNote } },
    "Gagal menolak pengajuan pindah"
  );
