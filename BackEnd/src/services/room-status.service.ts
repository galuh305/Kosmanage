
import { prisma } from "../lib/prisma";
import { finalizeEndedLeases } from "./lease.service";

export const syncRoomStatuses = async () => {
  // Tutup kontrak yang sudah berakhir / pindah lebih awal terlebih dahulu
  // supaya status kamar di bawah dihitung dari data yang sudah terbaru.
  await finalizeEndedLeases();

  const now = new Date();

  // Ambil seluruh kamar beserta kontrak sewanya yang masih aktif
  const rooms = await prisma.room.findMany({
    include: {
      leases: {
        where: {
          status: "ACTIVE",
        },
      },
    },
  });

  for (const room of rooms) {
    // Jangan mengubah kamar yang sedang dalam perbaikan
    if (room.status === "MAINTENANCE") {
      continue;
    }

    // Apakah ada tenant yang sedang menempati kamar?
    const hasCurrentLease = room.leases.some(
      (lease) =>
        lease.startDate <= now &&
        lease.endDate > now
    );

    // Apakah ada tenant yang akan menempati kamar di masa depan?
    const hasFutureLease = room.leases.some(
      (lease) =>
        lease.startDate > now &&
        lease.endDate > now
    );

    let newStatus:
      | "AVAILABLE"
      | "RESERVED"
      | "OCCUPIED";

    if (hasCurrentLease) {
      newStatus = "OCCUPIED";
    } else if (hasFutureLease) {
      newStatus = "RESERVED";
    } else {
      newStatus = "AVAILABLE";
    }

    // Update hanya jika status memang berubah
    if (room.status !== newStatus) {
      await prisma.room.update({
        where: {
          id: room.id,
        },
        data: {
          status: newStatus,
        },
      });
    }
  }

  return {
    pesan: "Sinkronisasi status kamar berhasil",
  };
};
