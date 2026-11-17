
import type { Context } from 'hono'
import { createPayment,
        approvePayment,
        rejectPayment, 
        getAllPayments,
        getPaymentProof
    } from '../services/payment.service'

import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export const createPaymentController = async (c: Context) => {
  let savedFilePath: string | null = null

  try {
    const user = c.get('authUser')

    // 1. Ambil data multipart/form-data
    const body = await c.req.parseBody()

    const invoiceId = Number(body.invoiceId)
    const proof = body.proof as File | undefined

    // 2. Validasi Invoice ID
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      return c.json({
        pesan: 'ID Invoice tidak valid',
      }, 400)
    }

    // 3. Validasi file
    if (!proof || typeof proof.arrayBuffer !== 'function') {
      return c.json({
        pesan: 'Bukti transfer wajib diunggah',
      }, 400)
    }

    const allowedTypes: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    }

    if (!allowedTypes[proof.type]) {
      return c.json({
        pesan: 'Format bukti transfer harus JPG, PNG, atau WebP',
      }, 400)
    }

    // 4. Batasi ukuran file maksimal 5 MB
    const maxSize = 5 * 1024 * 1024

    if (proof.size === 0 || proof.size > maxSize) {
      return c.json({
        pesan: 'Ukuran file harus lebih dari 0 dan maksimal 5 MB',
      }, 400)
    }

    // 5. Siapkan folder penyimpanan
    const uploadDir = path.resolve(
      process.cwd(),
      'uploads',
      'payment-proofs'
    )

    await mkdir(uploadDir, { recursive: true })

    // 6. Buat nama file unik
    const fileName = `${randomUUID()}${allowedTypes[proof.type]}`

    savedFilePath = path.join(uploadDir, fileName)

    const fileBuffer = Buffer.from(
      await proof.arrayBuffer()
    )

    await writeFile(savedFilePath, fileBuffer)

    // 7. Simpan data pembayaran
    const payment = await createPayment({
      invoiceId,
      userId: user.id,
      proofUrl: `uploads/payment-proofs/${fileName}`,
    })

    return c.json({
      pesan: 'Pembayaran berhasil diajukan dan menunggu verifikasi Owner',
      data: payment,
    }, 201)

  } catch (error) {
    // Hapus file jika penyimpanan pembayaran gagal
    if (savedFilePath) {
      await unlink(savedFilePath).catch(() => {})
    }

    console.error('Create payment error:', error)

    if (error instanceof Error) {
      switch (error.message) {
        case 'INVOICE_NOT_FOUND':
          return c.json({
            pesan: 'Invoice tidak ditemukan',
          }, 404)

        case 'INVOICE_ALREADY_PAID':
          return c.json({
            pesan: 'Invoice sudah lunas',
          }, 400)

        case 'INVOICE_CANCELLED':
          return c.json({
            pesan: 'Invoice sudah dibatalkan',
          }, 400)

        case 'PAYMENT_ALREADY_PENDING':
          return c.json({
            pesan: 'Pembayaran sebelumnya masih menunggu verifikasi',
          }, 409)
      }
    }

    return c.json({
      pesan: 'Gagal mengajukan pembayaran',
    }, 500)
  }
}


export const approvePaymentController = async (c: Context) => {
  try {
    const paymentId = Number(c.req.param('id'))

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return c.json({ pesan: 'ID pembayaran tidak valid' }, 400)
    }

    const body = await c.req.json().catch(() => ({}))

    const payment = await approvePayment({
      paymentId,
      ownerNote: body.ownerNote,
    })

    return c.json({
      pesan: 'Pembayaran berhasil disetujui',
      data: payment,
    })
  } catch (error) {
    console.error('Approve payment error:', error)

    if (error instanceof Error) {
      if (error.message === 'PAYMENT_NOT_FOUND') {
        return c.json({ pesan: 'Pembayaran tidak ditemukan' }, 404)
      }

      if (error.message === 'PAYMENT_NOT_PENDING') {
        return c.json({
          pesan: 'Pembayaran sudah pernah diproses',
        }, 400)
      }
    }

    return c.json({ pesan: 'Gagal menyetujui pembayaran' }, 500)
  }
}

export const rejectPaymentController = async (c: Context) => {
  try {
    const paymentId = Number(c.req.param('id'))

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return c.json({ pesan: 'ID pembayaran tidak valid' }, 400)
    }

    const body = await c.req.json().catch(() => ({}))

    const payment = await rejectPayment({
      paymentId,
      ownerNote: body.ownerNote,
    })

    return c.json({
      pesan: 'Pembayaran berhasil ditolak',
      data: payment,
    })
  } catch (error) {
    console.error('Reject payment error:', error)

    if (error instanceof Error) {
      if (error.message === 'PAYMENT_NOT_FOUND') {
        return c.json({ pesan: 'Pembayaran tidak ditemukan' }, 404)
      }

      if (error.message === 'PAYMENT_NOT_PENDING') {
        return c.json({
          pesan: 'Pembayaran sudah pernah diproses',
        }, 400)
      }
    }

    return c.json({ pesan: 'Gagal menolak pembayaran' }, 500)
  }
}


export const getAllPaymentsController = async (c: Context) => {
  try {
    const payments = await getAllPayments()

    return c.json({
      pesan: 'Berhasil mengambil daftar pembayaran',
      data: payments,
    })
  } catch (error) {
    console.error('Get payments error:', error)

    return c.json({
      pesan: 'Gagal mengambil daftar pembayaran',
    }, 500)
  }
}

export const getPaymentProofController = async (c: Context) => {
  try {
    const paymentId = Number(c.req.param('id'))

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return c.json({ pesan: 'ID pembayaran tidak valid' }, 400)
    }

    const proofUrl = await getPaymentProof(paymentId)

    const fileName = path.basename(proofUrl)

    const filePath = path.resolve(
      process.cwd(),
      'uploads',
      'payment-proofs',
      fileName
    )

    const file = await readFile(filePath)

    const extension = path.extname(fileName).toLowerCase()

    const contentType =
      extension === '.png'
        ? 'image/png'
        : extension === '.webp'
          ? 'image/webp'
          : 'image/jpeg'

    return c.body(file, 200, {
      'Content-Type': contentType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'PAYMENT_PROOF_NOT_FOUND' ||
        (error as NodeJS.ErrnoException).code === 'ENOENT')
    ) {
      return c.json({ pesan: 'Bukti transfer tidak ditemukan' }, 404)
    }

    console.error('Get payment proof error:', error)
    return c.json({ pesan: 'Gagal mengambil bukti transfer' }, 500)
  }
}