import type { Context } from "hono";
import {
  getAllBookings,
  getBookingById,
  createBooking,
  checkRoomAvailability,
  updateBookingStatus,
  approveBooking,
  regenerateActivationToken,
} from "../services/booking.service";

import { getRoomById } from "../services/room.service";

export const getBookingsController = async (c: Context) => {
  try {
    const bookings = await getAllBookings();

    return c.json({
      pesan: "Berhasil mengambil data pemesanan",
      data: bookings,
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        pesan: "Gagal mengambil data pemesanan",
      },
      500,
    );
  }
};

export const getBookingDetailController = async (c: Context) => {
  try {
    const id = Number(c.req.param("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ pesan: "ID pemesanan tidak valid" }, 400);
    }

    const booking = await getBookingById(id);

    if (!booking) {
      return c.json({ pesan: "Pemesanan tidak ditemukan" }, 404);
    }

    return c.json({
      pesan: "Berhasil mengambil detail pemesanan",
      data: booking,
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        pesan: "Gagal mengambil detail pemesanan",
      },
      500,
    );
  }
};

export const createBookingController = async (c: Context) => {
  try {
    const body = await c.req.json();

    const {
      roomId,
      guestName,
      guestEmail,
      guestPhone,
      startDate,
      endDate,
      message,
    } = body as Record<string, unknown>;

    if (
      !Number.isInteger(roomId) ||
      Number(roomId) <= 0 ||
      typeof guestName !== "string" ||
      !guestName.trim() ||
      typeof guestEmail !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) ||
      typeof guestPhone !== "string" ||
      !guestPhone.trim() ||
      typeof startDate !== "string"
    ) {
      return c.json(
        {
          pesan: "Data pemesanan tidak lengkap atau tidak valid",
        },
        400,
      );
    }

    const parsedStartDate = new Date(startDate);

    if (Number.isNaN(parsedStartDate.getTime())) {
      return c.json({ pesan: "Tanggal mulai tidak valid" }, 400);
    }

    let parsedEndDate: Date | undefined;

    if (endDate !== undefined && endDate !== null && endDate !== "") {
      if (typeof endDate !== "string") {
        return c.json({ pesan: "Tanggal selesai tidak valid" }, 400);
      }

      parsedEndDate = new Date(endDate);

      if (
        Number.isNaN(parsedEndDate.getTime()) ||
        parsedEndDate <= parsedStartDate
      ) {
        return c.json(
          {
            pesan: "Tanggal selesai harus setelah tanggal mulai",
          },
          400,
        );
      }
    }

    if (
      message !== undefined &&
      message !== null &&
      typeof message !== "string"
    ) {
      return c.json({ pesan: "Pesan harus berupa teks" }, 400);
    }

    const room = await getRoomById(Number(roomId));

    if (!room) {
      return c.json({ pesan: "Kamar tidak ditemukan" }, 404);
    }

    if (room.status !== "AVAILABLE") {
      return c.json(
        {
          pesan: "Kamar tidak tersedia untuk pengajuan pemesanan",
        },
        400,
      );
    }

    const isAvailable = await checkRoomAvailability(
      Number(roomId),
      parsedStartDate,
      parsedEndDate,
    );

    if (!isAvailable) {
      return c.json(
        {
          pesan: "Kamar sudah memiliki jadwal pemesanan pada periode tersebut",
        },
        409,
      );
    }

    const booking = await createBooking({
      roomId: Number(roomId),
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      message: message as string | undefined,
    });

    return c.json(
      {
        pesan: "Berhasil mengajukan pemesanan kamar",
        data: booking,
      },
      201,
    );
  } catch (error) {
    console.error(error);

    return c.json(
      {
        pesan: "Gagal mengajukan pemesanan kamar",
      },
      500,
    );
  }
};

export const updateBookingStatusController = async (c: Context) => {
  try {
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    const { status } = body as { status?: string }

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({
        pesan: 'ID pemesanan tidak valid',
      }, 400)
    }

    if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(status ?? '')) {
      return c.json({
        pesan: 'Status pemesanan tidak valid',
      }, 400)
    }

    const booking = await getBookingById(id)

    if (!booking) {
      return c.json({
        pesan: 'Pemesanan tidak ditemukan',
      }, 404)
    }

    if (booking.status !== 'PENDING') {
      return c.json({
        pesan: 'Hanya pemesanan berstatus PENDING yang dapat diubah',
      }, 400)
    }

    if (status === 'APPROVED') {
      const result = await approveBooking(id)

      return c.json({
        pesan: 'Pemesanan berhasil disetujui dan kontrak sewa berhasil dibuat',
        data: result.booking,
        activationToken: result.activationToken,
      })
    }

    const updatedBooking = await updateBookingStatus(
      id,
      status as 'REJECTED' | 'CANCELLED'
    )

    return c.json({
      pesan: 'Status pemesanan berhasil diperbarui',
      data: updatedBooking,
    })
  } catch (error) {
  if (error instanceof Error) {
    const errors: Record<string, { pesan: string; status: 400 | 404 | 409 }> = {
      BOOKING_NOT_FOUND: {
        pesan: 'Pemesanan tidak ditemukan',
        status: 404,
      },
      BOOKING_NOT_PENDING: {
        pesan: 'Pemesanan bukan berstatus PENDING',
        status: 400,
      },
      BOOKING_END_DATE_REQUIRED: {
        pesan: 'Tanggal selesai wajib diisi sebelum pemesanan disetujui',
        status: 400,
      },
      ROOM_BOOKING_CONFLICT: {
        pesan: 'Jadwal kamar bertabrakan dengan pemesanan lain',
        status: 409,
      },
      ROOM_LEASE_CONFLICT: {
        pesan: 'Kamar sudah memiliki kontrak sewa pada periode tersebut',
        status: 409,
      },
      EMAIL_BELONGS_TO_OWNER: {
        pesan: 'Email pemesan digunakan oleh akun Owner',
        status: 409,
      },
      EMAIL_ALREADY_REGISTERED: {
        pesan: 'Email sudah memiliki akun Tenant lain. Verifikasi kepemilikan akun diperlukan.',
        status: 409,
      },
    }

    const knownError = errors[error.message]

    if (knownError) {
      return c.json(
        { pesan: knownError.pesan },
        knownError.status
      )
    }
  }

  console.error(error)

  return c.json({
    pesan: 'Gagal memperbarui status pemesanan',
  }, 500)
}
}

export const regenerateActivationTokenController = async (c: Context) => {
  try {
    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ pesan: 'ID pemesanan tidak valid' }, 400)
    }

    const result = await regenerateActivationToken(id)

    return c.json({
      pesan: 'Token aktivasi baru berhasil dibuat',
      activationToken: result.activationToken,
      expiresAt: result.expiresAt,
    })
  } catch (error) {
    if (error instanceof Error) {
      const errors: Record<string, { pesan: string; status: 400 | 404 | 409 }> = {
        BOOKING_NOT_FOUND: {
          pesan: 'Pemesanan tidak ditemukan',
          status: 404,
        },
        BOOKING_NOT_APPROVED: {
          pesan: 'Token hanya tersedia untuk pemesanan yang sudah disetujui',
          status: 400,
        },
        TENANT_NOT_FOUND: {
          pesan: 'Akun Tenant untuk pemesanan ini tidak ditemukan',
          status: 404,
        },
        ACCOUNT_ALREADY_ACTIVATED: {
          pesan: 'Akun Tenant sudah diaktivasi, token tidak diperlukan lagi',
          status: 409,
        },
      }

      const knownError = errors[error.message]

      if (knownError) {
        return c.json({ pesan: knownError.pesan }, knownError.status)
      }
    }

    console.error(error)

    return c.json({ pesan: 'Gagal membuat token aktivasi' }, 500)
  }
}
