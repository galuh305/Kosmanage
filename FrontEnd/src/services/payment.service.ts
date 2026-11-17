import API_URL from "../config/api";

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

  invoice?: {
    invoiceNumber: string;
    lease: {
      user: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
      };
      room: {
        roomNumber: string;
        name: string;
      };
    };
  };
};

export type TenantInvoice = {
  id: number;
  leaseId: number;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  paidAt: string | null;
  status: "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED";
  description: string | null;
  lease: {
    room: {
      roomNumber: string;
      name: string;
      roomType: {
        name: string;
      };
    };
  };
  payments: Payment[];
};

export type CreatePaymentInput = {
  invoiceId: number;
  proof: File;
};

// Tenant mengajukan pembayaran
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

// Tenant mengambil daftar invoice
export const getTenantInvoices = async (): Promise<TenantInvoice[]> => {
  const token = localStorage.getItem("kosmanage_token");

  const response = await fetch(`${API_URL}/tenant/invoices`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Gagal mengambil tagihan Tenant");
  }

  return result.data;
};

// Owner mengambil seluruh pembayaran
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

// URL bukti transfer
export const getPaymentProofUrl = (paymentId: number): string => {
  return `${API_URL}/payments/${paymentId}/proof`;
};

// Mengambil gambar bukti transfer
export const getPaymentProof = async (
  paymentId: number,
): Promise<Blob> => {
  const token = localStorage.getItem("kosmanage_token");

  const response = await fetch(getPaymentProofUrl(paymentId), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil bukti transfer");
  }

  return await response.blob();
};

export const approvePayment = async (
  paymentId: number,
  ownerNote?: string
): Promise<Payment> => {
  const token = localStorage.getItem("kosmanage_token");

  const response = await fetch(
    `${API_URL}/payments/${paymentId}/approve`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ownerNote }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Gagal menyetujui pembayaran");
  }

  return result.data;
};

export const rejectPayment = async (
  paymentId: number,
  ownerNote: string
): Promise<Payment> => {
  const token = localStorage.getItem("kosmanage_token");

  const response = await fetch(
    `${API_URL}/payments/${paymentId}/reject`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ownerNote }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Gagal menolak pembayaran");
  }

  return result.data;
};