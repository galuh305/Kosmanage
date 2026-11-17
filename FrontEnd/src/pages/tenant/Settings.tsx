
import { useState, type FormEvent } from 'react'
import {
  LockKeyhole,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

import { changePassword } from '../../services/auth.service'

function Settings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setSuccess('')
    setError('')

    if (newPassword.length < 8) {
      setError('Password baru minimal 8 karakter')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok')
      return
    }

    if (currentPassword === newPassword) {
      setError('Password baru harus berbeda dari password lama')
      return
    }

    try {
      setLoading(true)

      const message = await changePassword(
        currentPassword,
        newPassword,
        confirmPassword
      )

      setSuccess(message)

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengganti password'
      )
    } finally {
      setLoading(false)
    }
  }

  const passwordField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    visible: boolean,
    toggleVisible: () => void,
    placeholder: string
  ) => (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          required
        />

        <button
          type="button"
          onClick={toggleVisible}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Pengaturan Akun
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Kelola keamanan akun dan password kamu.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <LockKeyhole size={23} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-800">
              Ganti Password
            </h2>
            <p className="text-sm text-gray-500">
              Perbarui password untuk menjaga keamanan akun.
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 size={19} />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {passwordField(
            'Password Lama',
            currentPassword,
            setCurrentPassword,
            showCurrent,
            () => setShowCurrent(!showCurrent),
            'Masukkan password lama'
          )}

          {passwordField(
            'Password Baru',
            newPassword,
            setNewPassword,
            showNew,
            () => setShowNew(!showNew),
            'Minimal 8 karakter'
          )}

          {passwordField(
            'Konfirmasi Password Baru',
            confirmPassword,
            setConfirmPassword,
            showConfirm,
            () => setShowConfirm(!showConfirm),
            'Ulangi password baru'
          )}

          <div className="rounded-xl bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Tips keamanan
                </p>
                <p className="mt-1 text-xs leading-relaxed text-blue-700">
                  Gunakan password minimal 8 karakter dan hindari
                  menggunakan password yang mudah ditebak.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Simpan Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Settings
