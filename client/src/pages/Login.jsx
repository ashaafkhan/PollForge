import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../context/AuthContext.jsx";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values) => {
    setError("");
    try {
      await login(values);
      const redirect = location.state?.from?.pathname || "/dashboard";
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">
          Log in to manage your polls and analytics.
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4 rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6"
        >
          <div>
            <label className="text-xs uppercase text-slate-500">Email</label>
            <input
              {...register("email")}
              type="email"
              className="mt-2 w-full rounded-lg border border-[#1E1E2E] bg-transparent px-3 py-2 text-sm text-slate-100"
            />
            {formState.errors.email && (
              <p className="mt-1 text-xs text-amber-400">Enter a valid email.</p>
            )}
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Password</label>
            <input
              {...register("password")}
              type="password"
              className="mt-2 w-full rounded-lg border border-[#1E1E2E] bg-transparent px-3 py-2 text-sm text-slate-100"
            />
            {formState.errors.password && (
              <p className="mt-1 text-xs text-amber-400">
                Password must be at least 8 characters.
              </p>
            )}
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg border border-[#22D3EE] px-4 py-2 text-sm text-[#22D3EE]"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          No account?{" "}
          <Link className="text-[#22D3EE]" to="/register">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
