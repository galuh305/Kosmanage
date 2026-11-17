import API_URL from "../config/api";

export type MaintenanceStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "REJECTED";

export type MaintenanceRequest = {
  id: number;
  leaseId: number;
  roomId: number;
  title: string;
  description: string;
  photoUrl: string | null;
  status: MaintenanceStatus;
  ownerNote: string | null;
  createdAt: string;
  updatedAt: string;

  room?: {
    id: number;
    roomNumber: string;
    name?: string;
  };

  lease?: {
    id: number;
    startDate: string;
    endDate: string;
    user?: {
      id: number;
      name: string;
      email: string;
      phone: string | null;
    };
  };
};

export type CreateMaintenanceInput = {
  leaseId: number;
  roomId: number;
  title: string;
  description: string;
  photo?: File | null;
};

export type UpdateMaintenanceInput = {
  status: Exclude<MaintenanceStatus, "PENDING">;
  ownerNote?: string;
};

// Mengambil laporan keluhan milik Tenant
export const getTenantMaintenance = async (): Promise<MaintenanceRequest[]> => {
  const token = localStorage.getItem("kosmanage_token");

  const response = await fetch(`${API_URL}/maintenance/tenant`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Gagal mengambil laporan keluhan");
  }

  return result.data;
};

// Membuat laporan keluhan dari Tenant, dengan foto opsional
export const createMaintenance = async (
  input: CreateMaintenanceInput
): Promise<MaintenanceRequest> => {
  const token = localStorage.getItem("kosmanage_token");

  const formData = new FormData();

  formData.append("leaseId", String(input.leaseId));
  formData.append("roomId", String(input.roomId));
  formData.append("title", input.title);
  formData.append("description", input.description);

  if (input.photo) {
    formData.append("photo", input.photo);
  }

  const response = await fetch(`${API_URL}/maintenance`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Gagal membuat laporan keluhan");
  }

  return result.data;
};

// Mengambil seluruh laporan keluhan untuk Owner
export const getMaintenance = async (): Promise<MaintenanceRequest[]> => {
  const token = localStorage.getItem("kosmanage_token");

  const response = await fetch(`${API_URL}/maintenance`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Gagal mengambil seluruh laporan keluhan");
  }

  return result.data;
};

// Memperbarui status laporan oleh Owner
export const updateMaintenanceStatus = async (
  id: number,
  input: UpdateMaintenanceInput
): Promise<MaintenanceRequest> => {
  const token = localStorage.getItem("kosmanage_token");

  const response = await fetch(`${API_URL}/maintenance/${id}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Gagal memperbarui status laporan");
  }

  return result.data;
};
