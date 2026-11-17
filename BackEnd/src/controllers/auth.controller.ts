
import type { Context } from 'hono'

import {
  registerUser,
  loginUser,
  activateTenantAccount,
  changeTenantPassword,
} from '../services/auth.service'

import { generateToken } from '../lib/auth'

export const registerController = async (c: Context) => {
  try {
    const body = await c.req.json()

    const { name, email, password, phone } = body as {
      name?: string
      email?: string
      password?: string
      phone?: string
    }

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return c.json({
        pesan: 'Nama, email, atau password tidak valid. Password minimal 8 karakter.',
      }, 400)
    }

    if (
      phone !== undefined &&
      phone !== null &&
      typeof phone !== 'string'
    ) {
      return c.json({
        pesan: 'Nomor telepon tidak valid',
      }, 400)
    }

    const user = await registerUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone?.trim(),
    })

    return c.json({
      pesan: 'Registrasi berhasil',
      data: user,
    }, 201)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'EMAIL_ALREADY_EXISTS'
    ) {
      return c.json({
        pesan: 'Email sudah terdaftar',
      }, 409)
    }

    console.error(error)

    return c.json({
      pesan: 'Registrasi gagal',
    }, 500)
  }
}

export const loginController = async (c: Context) => {
  try {
    const body = await c.req.json()

    const { email, password } = body as {
      email?: string
      password?: string
    }

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return c.json({
        pesan: 'Email dan password wajib diisi',
      }, 400)
    }

    const user = await loginUser(
      email.trim().toLowerCase(),
      password
    )

    const token = await generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    return c.json({
      pesan: 'Login berhasil',
      data: {
        user,
        token,
      },
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'INVALID_CREDENTIALS'
    ) {
      return c.json({
        pesan: 'Email atau password salah',
      }, 401)
    }

    console.error(error)

    return c.json({
      pesan: 'Login gagal',
    }, 500)
  }
}

export const activateTenantController = async (c: Context) => {
  try {
    const body = await c.req.json()

    const { token, password } = body as {
      token?: string
      password?: string
    }

    if (
      typeof token !== 'string' ||
      !token.trim() ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return c.json({
        pesan: 'Token wajib diisi dan password minimal 8 karakter',
      }, 400)
    }

    const user = await activateTenantAccount(
      token.trim(),
      password
    )

    return c.json({
      pesan: 'Akun Tenant berhasil diaktivasi. Silakan login.',
      data: user,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_ACTIVATION_TOKEN') {
        return c.json({
          pesan: 'Token aktivasi tidak valid',
        }, 400)
      }

      if (error.message === 'ACTIVATION_TOKEN_EXPIRED') {
        return c.json({
          pesan: 'Token aktivasi sudah kedaluwarsa',
        }, 400)
      }

      if (error.message === 'ACCOUNT_ALREADY_ACTIVATED') {
        return c.json({
          pesan: 'Akun sudah diaktivasi sebelumnya',
        }, 400)
      }
    }

    console.error(error)

    return c.json({
      pesan: 'Aktivasi akun gagal',
    }, 500)
  }
}

export const changePasswordController = async (c: Context) => {
  try {
    const body = await c.req.json()

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = body as {
      currentPassword?: string
      newPassword?: string
      confirmPassword?: string
    }

    // Validasi password lama
    if (
      typeof currentPassword !== 'string' ||
      !currentPassword
    ) {
      return c.json({
        pesan: 'Password lama wajib diisi',
      }, 400)
    }

    // Validasi password baru
    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 8
    ) {
      return c.json({
        pesan: 'Password baru minimal 8 karakter',
      }, 400)
    }

    // Validasi konfirmasi password
    if (
      typeof confirmPassword !== 'string' ||
      confirmPassword !== newPassword
    ) {
      return c.json({
        pesan: 'Konfirmasi password tidak cocok',
      }, 400)
    }

    if (currentPassword === newPassword) {
      return c.json({
        pesan: 'Password baru harus berbeda dari password lama',
      }, 400)
    }

    const user = c.get('authUser')

    if (user.role !== 'TENANT') {
      return c.json({
        pesan: 'Fitur ini hanya tersedia untuk tenant',
      }, 403)
    }

    await changeTenantPassword(
      user.id,
      currentPassword,
      newPassword
    )

    return c.json({
      pesan: 'Password berhasil diperbarui',
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_CURRENT_PASSWORD') {
        return c.json({
          pesan: 'Password lama yang kamu masukkan salah',
        }, 400)
      }

      if (error.message === 'USER_NOT_FOUND') {
        return c.json({
          pesan: 'Akun tenant tidak ditemukan atau tidak aktif',
        }, 404)
      }
    }

    console.error(error)

    return c.json({
      pesan: 'Gagal memperbarui password',
    }, 500)
  }
}