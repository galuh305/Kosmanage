
import { prisma } from '../lib/prisma'
import { completeExtensionForInvoice } from './lease.service'

type CreatePaymentInput = {
  invoiceId: number
  userId: number
  proofUrl: string
}

export const createPayment = async ({
  invoiceId,
  userId,
  proofUrl,
}: CreatePaymentInput) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Periksa Invoice dan kepemilikan Tenant
    const invoice = await tx.invoice.findFirst({
      where: {
        id: invoiceId,
        lease: {
          is: {
            userId,
          },
        },
      },
    })

    if (!invoice) {
      throw new Error('INVOICE_NOT_FOUND')
    }

    // 2. Periksa status Invoice
    if (invoice.status === 'PAID') {
      throw new Error('INVOICE_ALREADY_PAID')
    }

    if (invoice.status === 'CANCELLED') {
      throw new Error('INVOICE_CANCELLED')
    }

    // 3. Cegah pengajuan pembayaran berulang
    const existingPayment = await tx.payment.findFirst({
      where: {
        invoiceId,
        transactionStatus: 'PENDING_VERIFICATION',
      },
    })

    if (existingPayment) {
      throw new Error('PAYMENT_ALREADY_PENDING')
    }

    // 4. Simpan pembayaran
    return await tx.payment.create({
      data: {
        invoiceId,
        amount: invoice.amount,
        paymentMethod: 'BANK_TRANSFER',
        transactionStatus: 'PENDING_VERIFICATION',
        proofUrl,
      },
    })
  })
}


type VerifyPaymentInput = {
  paymentId: number
  ownerNote?: string
}

export const approvePayment = async ({
  paymentId,
  ownerNote,
}: VerifyPaymentInput) => {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND')
    }

    if (payment.transactionStatus !== 'PENDING_VERIFICATION') {
      throw new Error('PAYMENT_NOT_PENDING')
    }

    const now = new Date()

    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        transactionStatus: 'APPROVED',
        ownerNote,
        verifiedAt: now,
        paidAt: now,
      },
    })

    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: 'PAID',
        paidAt: now,
      },
    })

    // Jika invoice ini adalah tagihan perpanjangan sewa, masa sewa
    // diperpanjang sekarang (tanggal berakhir kontrak digeser).
    await completeExtensionForInvoice(tx, payment.invoiceId)

    return updatedPayment
  })
}

export const rejectPayment = async ({
  paymentId,
  ownerNote,
}: VerifyPaymentInput) => {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND')
    }

    if (payment.transactionStatus !== 'PENDING_VERIFICATION') {
      throw new Error('PAYMENT_NOT_PENDING')
    }

    return await tx.payment.update({
      where: { id: paymentId },
      data: {
        transactionStatus: 'REJECTED',
        ownerNote,
        verifiedAt: new Date(),
      },
    })
  })
}


export const getAllPayments = async () => {
  return await prisma.payment.findMany({
    include: {
      invoice: {
        include: {
          lease: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
              room: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}


export const getPaymentProof = async (paymentId: number) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      proofUrl: true,
    },
  })

  if (!payment || !payment.proofUrl) {
    throw new Error('PAYMENT_PROOF_NOT_FOUND')
  }

  return payment.proofUrl
}