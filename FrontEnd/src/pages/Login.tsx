
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { login } from "../services/auth.service";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const user = await login(email, password);

      if (user.role === "OWNER") {
        navigate("/owner/dashboard", { replace: true });
      } else if (user.role === "TENANT") {
        navigate("/tenant", { replace: true });
      } else {
        setError("Role akun tidak dikenali.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <LockKeyhole size={27} />
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            Login KosManage
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Masuk untuk mengelola properti kos Anda.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-blue-500">
              <Mail size={18} className="text-slate-400" />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
                className="w-full border-0 px-3 py-3 text-sm outline-none"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-blue-500">
              <LockKeyhole size={18} className="text-slate-400" />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full border-0 px-3 py-3 text-sm outline-none"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-700"
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Memproses login..." : "Masuk"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Sudah mendapatkan persetujuan booking?
          </p>

          <Link
            to="/activate"
            className="mt-2 inline-block text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Aktivasi Akun Tenant
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          KosManage — Sistem Manajemen Kos
        </p>
      </div>
    </main>
  );
}

export default Login;
