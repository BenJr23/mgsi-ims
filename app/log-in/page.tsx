"use client";

import { signInWithEmailAction } from "@/app/_actions/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type LoginFormData = {
  email: string;
  password: string;
};

const initialLoginData: LoginFormData = {
  email: "",
  password: "",
};

export default function LogInPage() {
  const [formData, setFormData] = useState<LoginFormData>(initialLoginData);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const canSubmit = useMemo(
    () => formData.email.trim().length > 0 && formData.password.length > 0,
    [formData.email, formData.password]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setServerError(null);

    if (!canSubmit) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInWithEmailAction({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (!result.ok) {
        setServerError(result.message);
        return;
      }

      const nextPath = searchParams.get("next") || "/";
      router.replace(nextPath);
      router.refresh();
    } catch {
      setServerError("Unable to sign in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-10 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(59,130,246,0.2),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(20,184,166,0.18),transparent_28%),radial-gradient(circle_at_60%_90%,rgba(245,158,11,0.2),transparent_32%)]" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-10">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-700">MGSI IMS</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">Log in to continue managing your inventory workspace.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-slate-800">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
            {submitted && formData.email.trim().length === 0 ? (
              <p className="text-xs text-rose-600">Please enter your email address.</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-slate-800">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={formData.password}
              onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
            {submitted && formData.password.length === 0 ? (
              <p className="text-xs text-rose-600">Please enter your password.</p>
            ) : null}
          </div>

          {serverError ? <p className="text-sm text-rose-600">{serverError}</p> : null}

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isLoading || (!canSubmit && submitted)}
          >
            {isLoading ? "Signing in..." : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New here?{" "}
          <Link href="/sign-up" className="font-semibold text-blue-700 hover:text-blue-800">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
