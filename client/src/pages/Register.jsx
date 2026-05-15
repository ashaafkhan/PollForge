import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export default function Register() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values) => {
    try {
      await signup(values);
      toast.success("Account created! Welcome aboard 🎉");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-2 text-sm text-slate-400">
          Start building intelligent polls in minutes.
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4 rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6"
        >
          <div>
            <label className="text-xs uppercase text-slate-500">Name</label>
            <input
              {...register("name")}
              type="text"
              className="mt-2 w-full rounded-lg border border-[#1E1E2E] bg-transparent px-3 py-2 text-sm text-slate-100"
            />
            {formState.errors.name && (
              <p className="mt-1 text-xs text-amber-400">Enter your name.</p>
            )}
          </div>
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
          <button
            type="submit"
            className="w-full rounded-lg border border-[#22D3EE] px-4 py-2 text-sm text-[#22D3EE]"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          Already have an account?{" "}
          <Link className="text-[#22D3EE]" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
