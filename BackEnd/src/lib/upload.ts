
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
}

export const uploadRoomImage = async (file: File): Promise<string> => {
  if (!(file instanceof File)) {
    throw new Error('File foto tidak valid')
  }

  if (!ALLOWED_TYPES[file.type]) {
    throw new Error('Format foto harus JPG, JPEG, atau PNG')
  }

  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran foto maksimal 5 MB')
  }

  const extension = ALLOWED_TYPES[file.type]
  const filename = `${randomUUID()}${extension}`

  const uploadDirectory = resolve(
    process.cwd(),
    'uploads',
    'rooms'
  )

  await mkdir(uploadDirectory, { recursive: true })

  const filePath = resolve(uploadDirectory, filename)
  const buffer = Buffer.from(await file.arrayBuffer())

  await writeFile(filePath, buffer)

  return `/uploads/rooms/${filename}`
}
