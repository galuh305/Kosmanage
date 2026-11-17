
import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, ImagePlus, X } from 'lucide-react'

import {
  getRoomById,
  updateRoom,
  updateRoomFacilities,
  type UpdateRoomInput,
} from '../../services/room.service'

import {
  getRoomTypes,
  type RoomType,
} from '../../services/roomType.service'

import {
  getFacilities,
  type Facility,
} from '../../services/facility.service'

import API_URL from '../../config/api'

const API_BASE_URL = API_URL.replace(/\/api\/?$/, '')

function EditRoom() {
  const navigate = useNavigate()
  const { id } = useParams()
  const roomId = Number(id)

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<number[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    roomNumber: '',
    name: '',
    description: '',
    price: '',
    roomTypeId: '',
  })

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !Number.isInteger(roomId) || roomId <= 0) {
      setError('ID kamar tidak valid.')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const [room, types, facilityData] = await Promise.all([
          getRoomById(roomId),
          getRoomTypes(),
          getFacilities(),
        ])

        setRoomTypes(types)
        setFacilities(facilityData)

        setForm({
          roomNumber: room.roomNumber,
          name: room.name,
          description: room.description ?? '',
          price: room.price !== null ? String(room.price) : '',
          roomTypeId: String(room.roomTypeId),
        })

        setCurrentImageUrl(room.imageUrl)

        setSelectedFacilityIds(
          room.facilities.map((item) => item.facility.id)
        )
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal mengambil data kamar'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, roomId])

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Format foto harus JPG, JPEG, atau PNG.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5 MB.')
      event.target.value = ''
      return
    }

    setError('')
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleFacilityChange = (facilityId: number) => {
    setSelectedFacilityIds((previous) =>
      previous.includes(facilityId)
        ? previous.filter((item) => item !== facilityId)
        : [...previous, facilityId]
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!form.roomTypeId) {
      setError('Silakan pilih tipe kamar.')
      return
    }

    const data: UpdateRoomInput = {
      roomNumber: form.roomNumber.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price ? Number(form.price) : undefined,
      roomTypeId: Number(form.roomTypeId),
      image,
    }

    if (
      !data.roomNumber ||
      !data.name ||
      (data.price !== undefined &&
        (!Number.isFinite(data.price) || data.price <= 0))
    ) {
      setError('Periksa kembali nomor, nama, dan harga kamar.')
      return
    }

    try {
      setSaving(true)

      await updateRoom(roomId, data)
      await updateRoomFacilities(roomId, selectedFacilityIds)

      navigate('/owner/rooms')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memperbarui kamar'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        Memuat data kamar...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate('/owner/rooms')}
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Kembali ke daftar kamar
        </button>

        <h1 className="text-2xl font-bold text-gray-900">
          Edit Kamar
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Perbarui informasi, foto, dan fasilitas kamar.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
      >
        {/* Foto kamar */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Foto Kamar
          </label>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:w-72">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview foto kamar baru"
                  className="h-full w-full object-cover"
                />
              ) : currentImageUrl ? (
                <img
                  src={`${API_BASE_URL}${currentImageUrl}`}
                  alt={`Foto ${form.name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <ImagePlus size={36} className="mx-auto mb-2" />
                  <span className="text-sm">Belum ada foto</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <ImagePlus size={18} />
                {image ? 'Pilih Foto Lain' : 'Ganti Foto'}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {image && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                >
                  <X size={16} />
                  Batalkan foto baru
                </button>
              )}

              <p className="text-xs text-gray-500">
                Format JPG atau PNG. Maksimal 5 MB.
              </p>

              <p className="text-xs text-gray-500">
                Jika tidak mengganti foto, foto lama akan tetap digunakan.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nomor Kamar
            </label>

            <input
              type="text"
              value={form.roomNumber}
              onChange={(e) =>
                setForm({ ...form, roomNumber: e.target.value })
              }
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nama Kamar
            </label>

            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tipe Kamar
            </label>

            <select
              value={form.roomTypeId}
              onChange={(e) =>
                setForm({ ...form, roomTypeId: e.target.value })
              }
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="">Pilih tipe kamar</option>

              {roomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Harga Sewa per Bulan
            </label>

            <input
              type="number"
              min="1"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value })
              }
              placeholder="Contoh: 750000"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Deskripsi Kamar
          </label>

          <textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Masukkan deskripsi kamar..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <h2 className="mb-1 text-sm font-semibold text-gray-900">
            Fasilitas Kamar
          </h2>

          <p className="mb-3 text-xs text-gray-500">
            Centang fasilitas yang tersedia di kamar ini.
          </p>

          {facilities.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              Belum ada fasilitas yang tersedia.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map((facility) => (
                <label
                  key={facility.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedFacilityIds.includes(facility.id)}
                    onChange={() => handleFacilityChange(facility.id)}
                    className="h-4 w-4 rounded accent-blue-600"
                  />

                  <span className="text-sm text-gray-700">
                    {facility.name}
                  </span>
                </label>
              ))}
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            {selectedFacilityIds.length} fasilitas dipilih
          </p>
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditRoom
