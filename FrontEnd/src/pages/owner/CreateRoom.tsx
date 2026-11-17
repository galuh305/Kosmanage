
import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, ImagePlus, X } from 'lucide-react'

import {
  createRoom,
  type CreateRoomInput,
} from '../../services/room.service'

import {
  getRoomTypes,
  type RoomType,
} from '../../services/roomType.service'

import {
  getFacilities,
  type Facility,
} from '../../services/facility.service'

function CreateRoom() {
  const navigate = useNavigate()

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])

  const [loadingTypes, setLoadingTypes] = useState(true)
  const [loadingFacilities, setLoadingFacilities] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')

  const [form, setForm] = useState({
    roomNumber: '',
    name: '',
    description: '',
    price: '',
    roomTypeId: '',
  })

  const [selectedFacilityIds, setSelectedFacilityIds] = useState<number[]>([])
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomTypeData, facilityData] = await Promise.all([
          getRoomTypes(),
          getFacilities(),
        ])

        setRoomTypes(roomTypeData)
        setFacilities(facilityData)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal mengambil data kamar'
        )
      } finally {
        setLoadingTypes(false)
        setLoadingFacilities(false)
      }
    }

    fetchData()
  }, [])

  // Membersihkan URL preview ketika komponen dilepas
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

    const allowedTypes = ['image/jpeg', 'image/png']

    if (!allowedTypes.includes(file.type)) {
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
    setImagePreview('')

    const input = document.getElementById('room-image') as HTMLInputElement | null

    if (input) {
      input.value = ''
    }
  }

  const handleFacilityChange = (facilityId: number) => {
    setSelectedFacilityIds((previous) =>
      previous.includes(facilityId)
        ? previous.filter((id) => id !== facilityId)
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

    const data: CreateRoomInput = {
      roomNumber: form.roomNumber.trim(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: form.price ? Number(form.price) : undefined,
      roomTypeId: Number(form.roomTypeId),
      facilityIds: selectedFacilityIds,
      image: image,
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

      await createRoom(data)

      navigate('/owner/rooms')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menambahkan kamar'
      )
    } finally {
      setSaving(false)
    }
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
          Tambah Kamar
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Masukkan informasi kamar dan pilih fasilitas yang tersedia.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

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
              placeholder="Contoh: A01"
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
              placeholder="Contoh: Kamar Standard"
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
              disabled={loadingTypes}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">
                {loadingTypes
                  ? 'Memuat tipe kamar...'
                  : 'Pilih tipe kamar'}
              </option>

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

        {/* Upload Foto Kamar */}
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Foto Kamar
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Pilih satu foto utama kamar. Format JPG atau PNG, maksimal 5 MB.
            </p>
          </div>

          {imagePreview ? (
            <div className="relative max-w-md overflow-hidden rounded-xl border border-gray-200">
              <img
                src={imagePreview}
                alt="Preview foto kamar"
                className="h-64 w-full object-cover"
              />

              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-red-600 shadow hover:bg-red-50"
              >
                <X size={16} />
                Hapus foto
              </button>
            </div>
          ) : (
            <label
              htmlFor="room-image"
              className="flex max-w-md cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50"
            >
              <ImagePlus size={36} className="mb-3 text-gray-400" />

              <span className="text-sm font-medium text-gray-700">
                Klik untuk memilih foto kamar
              </span>

              <span className="mt-1 text-xs text-gray-500">
                JPG atau PNG, maksimal 5 MB
              </span>
            </label>
          )}

          <input
            id="room-image"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Fasilitas */}
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Fasilitas Kamar
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Pilih fasilitas yang tersedia di kamar ini. Bisa memilih lebih dari satu.
            </p>
          </div>

          {loadingFacilities ? (
            <p className="text-sm text-gray-500">
              Memuat daftar fasilitas...
            </p>
          ) : facilities.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              Belum ada fasilitas yang tersedia. Tambahkan fasilitas terlebih dahulu.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map((facility) => (
                <label
                  key={facility.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-100 p-3 transition hover:bg-gray-50"
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
            disabled={saving || loadingTypes || loadingFacilities}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Menyimpan...' : 'Simpan Kamar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateRoom
