import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatDetail = (d) => {
    if (!d) return "Login failed";
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((e) => e?.msg || JSON.stringify(e)).join(" ");
    return String(d);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/admin/login", { email, password });
      setUser(data);
      toast.success(`Welcome back, ${data.name}.`);
      navigate("/admin", { replace: true });
    } catch (err) {
      toast.error(formatDetail(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 border border-ink mb-6">
            <Lock size={20} />
          </div>
          <div className="overline text-moss mb-2">Editor access</div>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tighter">Admin sign-in.</h1>
          <p className="text-graphite mt-3">For editors only. Property owners and readers should use Google sign-in.</p>
        </div>

        <form onSubmit={submit} className="space-y-6 bg-white border border-rule p-8" data-testid="admin-login-form">
          <div>
            <label className="overline block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-rule rounded-none px-0 py-2 focus:outline-none focus:border-ink transition-colors"
              required
              data-testid="admin-login-email"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="overline block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-rule rounded-none px-0 py-2 focus:outline-none focus:border-ink transition-colors"
              required
              data-testid="admin-login-password"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3.5 font-sans uppercase tracking-widest text-xs disabled:opacity-50"
            data-testid="admin-login-submit"
          >
            {loading ? "Signing in…" : "Sign in as admin"}
          </button>
        </form>

        <div className="mt-8 text-center overline text-graphite">
          Not an editor? <Link to="/" className="text-ink hover:text-moss underline underline-offset-4">Go home</Link>
        </div>
      </div>
    </div>
  );
}
