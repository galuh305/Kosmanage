
import 'dotenv/config'
import { hash } from 'bcryptjs'
import { prisma } from '../lib/prisma'

async function main() {
  const name = 'Owner KosManage'
  const email = 'owner@kosmanage.com'
  const password = process.env.OWNER_PASSWORD

  if (!password || password.length < 8) {
    throw new Error(
      'OWNER_PASSWORD belum diatur atau kurang dari 8 karakter'
    )
  }

  const existingOwner = await prisma.user.findUnique({
    where: { email },
  })

  if (existingOwner) {
    console.log('Akun owner sudah tersedia.')
    return
  }

  const hashedPassword = await hash(password, 12)

  const owner = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'OWNER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  console.log('Akun owner berhasil dibuat:')
  console.log(owner)
}

main()
  .catch((error) => {
    console.error('Gagal membuat akun owner:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
