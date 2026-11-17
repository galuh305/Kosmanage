import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3306,
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: 'kosmanage',
  connectionLimit: 5,
})

export const prisma = new PrismaClient({
  adapter,
})