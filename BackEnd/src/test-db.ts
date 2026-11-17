import { prisma } from './lib/prisma'

async function main() {
  try {
    await prisma.$connect()

    console.log('Koneksi ke MySQL berhasil!')

    const totalUser = await prisma.user.count()

    console.log('Jumlah user:', totalUser)
  } catch (error) {
    console.error('Koneksi database gagal:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()