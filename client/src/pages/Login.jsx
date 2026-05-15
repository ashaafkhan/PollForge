import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { auth, googleProvider } from "../lib/firebase.js";
import { signInWithPopup } from "firebase/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export default function Login() {
  const { login, loginWithFirebase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values) => {
    try {
      await login(values);
      const redirect = location.state?.from?.pathname || "/dashboard";
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await loginWithFirebase(idToken);
      const redirect = location.state?.from?.pathname || "/dashboard";
      navigate(redirect, { replace: true });
      toast.success("Welcome back! 👋");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Google authentication failed");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] theme-transition flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <img src="/pollforge-logo.png" alt="Logo" className="h-12 w-12" />
            <span className="font-display text-3xl font-black gradient-text">PollForge</span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-[var(--text-muted)]">Sign in to manage your polls.</p>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] mb-2 block">Email Address</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm focus:border-[var(--primary)] outline-none"
              />
              {formState.errors.email && <p className="mt-1 text-xs text-rose-500">Enter a valid email.</p>}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] mb-2 block">Password</label>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm focus:border-[var(--primary)] outline-none"
              />
              {formState.errors.password && <p className="mt-1 text-xs text-rose-500">Min 8 characters required.</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--primary)] py-3 text-sm font-bold text-white shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-[var(--surface)] px-4 text-[var(--text-muted)]">Social Login</span></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm font-bold hover:bg-[var(--surface-hover)] transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            </svg>
            Sign in with Google
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
          New to PollForge? <Link className="font-bold text-[var(--primary)] hover:underline" to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
