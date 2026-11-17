import API_URL from "../config/api";

export type AuthUser = {
  id: number
  name: string
  email: string
  phone?: string | null
  role: 'OWNER' | 'TENANT'
}

type LoginResponse = {
  pesan: string
  data?: {
    user: AuthUser
    token: string
  }
}

export const login = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  const result = await response.json() as LoginResponse

  if (!response.ok || !result.data) {
    throw new Error(result.pesan || 'Login gagal')
  }

  const { user, token } = result.data

  // Simpan token dan informasi pengguna
  localStorage.setItem('kosmanage_token', token)
  localStorage.setItem('kosmanage_user', JSON.stringify(user))

  return user
}

export const getToken = (): string | null => {
  return localStorage.getItem('kosmanage_token')
}

export const getStoredUser = (): AuthUser | null => {
  const user = localStorage.getItem('kosmanage_user')

  if (!user) return null

  try {
    return JSON.parse(user) as AuthUser
  } catch {
    return null
  }
}

export const logout = (): void => {
  localStorage.removeItem('kosmanage_token')
  localStorage.removeItem('kosmanage_user')
}

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<string> => {
  const token = getToken()

  if (!token) {
    throw new Error('Silakan login terlebih dahulu')
  }

  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword,
    }),
  })

  const result = await response.json() as {
    pesan: string
  }

  if (!response.ok) {
    throw new Error(result.pesan || 'Gagal mengganti password')
  }

  return result.pesan
}