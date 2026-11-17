
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-100 px-4 py-8">
      {/* Dekorasi background */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl" />

      <div className="animate-fade-up relative w-full max-w-md rounded-3xl border border-white bg-white/90 p-8 shadow-xl shadow-blue-100/60 backdrop-blur sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-200">
            <LockKeyhole size={26} />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Login KosManage
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Masuk untuk mengelola properti kos Anda.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>

            <div className="group flex items-center rounded-xl border border-slate-200 bg-white px-3.5 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 hover:border-slate-300">
              <Mail
                size={18}
                className="text-slate-400 transition-colors group-focus-within:text-blue-600"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
                className="w-full border-0 bg-transparent px-3 py-3 text-sm outline-none"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <div className="group flex items-center rounded-xl border border-slate-200 bg-white px-3.5 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 hover:border-slate-300">
              <LockKeyhole
                size={18}
                className="text-slate-400 transition-colors group-focus-within:text-blue-600"
              />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full border-0 bg-transparent px-3 py-3 text-sm outline-none"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="animate-pop-in rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {loading ? "Memproses login..." : "Masuk"}
          </button>
        </form>

        <div className="mt-7 border-t border-slate-100 pt-6 text-center">
          <p className="text-sm text-slate-500">
            Sudah mendapatkan persetujuan booking?
          </p>

          <Link
            to="/activate"
            className="mt-2 inline-block text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline hover:underline-offset-4"
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
