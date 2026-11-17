
import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:3000/api";

function ActivateAccount() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleActivate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setSuccess(false);

    if (password.length < 8) {
      setMessage("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.pesan || "Aktivasi akun gagal.");
      }

      setSuccess(true);
      setMessage(result.pesan || "Akun berhasil diaktivasi.");
      setToken("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat aktivasi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            Aktivasi Akun
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Buat password baru untuk mengaktifkan akun Tenant KosManage.
          </p>
        </div>

        <form onSubmit={handleActivate} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Token Aktivasi
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Masukkan token aktivasi"
              rows={3}
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password Baru
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              minLength={8}
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Konfirmasi Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              minLength={8}
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {message && (
            <div
              className={`rounded-lg p-3 text-sm ${
                success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Mengaktivasi..." : "Aktivasi Akun"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Sudah memiliki akun?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ActivateAccount;
