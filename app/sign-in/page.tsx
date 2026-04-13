"use client";

import { signInWithEmailAction } from "@/app/_actions/auth";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

type LoginFormData = {
  email: string;
  password: string;
};

const initialLoginData: LoginFormData = {
  email: "",
  password: "",
};

export default function LogInPage() {
  return (
    <Suspense fallback={<SignInPageFallback />}>
      <SignInPageContent />
    </Suspense>
  );
}

function SignInPageFallback() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-100 px-4 py-8 text-black sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(139,29,29,0.16),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(17,24,39,0.12),transparent_28%),radial-gradient(circle_at_58%_92%,rgba(120,53,15,0.12),transparent_30%)]" />
      <section className="relative z-10 w-full max-w-lg rounded-3xl border border-stone-300/80 bg-white/95 p-7 shadow-[0_20px_50px_-20px_rgba(28,25,23,0.35)] backdrop-blur-sm sm:p-10">
        <div className="mb-6 sm:mb-8">
          <Image
            src="/logo/GWlogo.webp"
            alt="GreatWork"
            width={340}
            height={90}
            className="mb-6 h-auto w-56 sm:w-64"
            priority
          />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8B1D1D]">MGSI IMS</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#8B1D1D] sm:text-[2rem]">Welcome back</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">Loading sign in form...</p>
        </div>
      </section>
    </main>
  );
}

function SignInPageContent() {
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
    } catch (error) {
      console.error("[Sign In] Error:", error);
      setServerError("Unable to sign in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-100 px-4 py-8 text-black sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(139,29,29,0.16),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(17,24,39,0.12),transparent_28%),radial-gradient(circle_at_58%_92%,rgba(120,53,15,0.12),transparent_30%)]" />

      <section className="relative z-10 w-full max-w-lg rounded-3xl border border-stone-300/80 bg-white/95 p-7 shadow-[0_20px_50px_-20px_rgba(28,25,23,0.35)] backdrop-blur-sm sm:p-10">
        <div className="mb-6 sm:mb-8">
          {/* <Image
            src="/logo/GWlogo.webp"
            alt="GreatWork"
            width={340}
            height={90}
            className="mb-6 h-auto w-56 sm:w-64"
            priority
          /> */}
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8B1D1D]">MGSI IMS</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#8B1D1D] sm:text-[2rem]">Welcome back</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">Sign in to continue managing your inventory workspace.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-black">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none transition placeholder:text-gray-600 focus:border-[#8B1D1D] focus:ring-2 focus:ring-[#8B1D1D]/20"
              required
            />
            {submitted && formData.email.trim().length === 0 ? (
              <p className="text-xs text-rose-600">Please enter your email address.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-black">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={formData.password}
              onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none transition placeholder:text-gray-600 focus:border-[#8B1D1D] focus:ring-2 focus:ring-[#8B1D1D]/20"
              required
            />
            {submitted && formData.password.length === 0 ? (
              <p className="text-xs text-rose-600">Please enter your password.</p>
            ) : null}
          </div>

          {serverError ? <p className="text-sm text-rose-600">{serverError}</p> : null}

          <button
            type="submit"
            className="mt-1 w-full rounded-xl bg-[#8B1D1D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#741818] focus:outline-none focus:ring-2 focus:ring-[#8B1D1D]/35 disabled:cursor-not-allowed disabled:bg-stone-400"
            disabled={isLoading || (!canSubmit && submitted)}
          >
            {isLoading ? "Signing in..." : "Log In"}
          </button>
        </form>
      </section>
    </main>
  );
}
