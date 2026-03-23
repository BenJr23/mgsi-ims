"use client";

import { signUpWithEmailAction } from "@/app/_actions/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type FormData = {
	fullName: string;
	email: string;
	password: string;
	confirmPassword: string;
	termsAccepted: boolean;
};

const initialFormData: FormData = {
	fullName: "",
	email: "",
	password: "",
	confirmPassword: "",
	termsAccepted: false,
};

export default function SignUpPage() {
	const [formData, setFormData] = useState<FormData>(initialFormData);
	const [submitted, setSubmitted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);
	const [serverSuccess, setServerSuccess] = useState<string | null>(null);
	const router = useRouter();

	const passwordsMatch = useMemo(
		() =>
			formData.password.length === 0 ||
			formData.confirmPassword.length === 0 ||
			formData.password === formData.confirmPassword,
		[formData.confirmPassword, formData.password]
	);

	const passwordLongEnough = formData.password.length === 0 || formData.password.length >= 8;

	const canSubmit =
		formData.fullName.trim().length > 0 &&
		formData.email.trim().length > 0 &&
		formData.password.length >= 8 &&
		formData.confirmPassword.length > 0 &&
		passwordsMatch &&
		formData.termsAccepted;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitted(true);
		setServerError(null);
		setServerSuccess(null);

		if (!canSubmit) {
			return;
		}

		setIsLoading(true);

		try {
			const result = await signUpWithEmailAction({
				name: formData.fullName.trim(),
				email: formData.email.trim(),
				password: formData.password,
			});

			if (!result.ok) {
				setServerError(result.message);
				return;
			}

			setServerSuccess("Account created successfully! Redirecting...");
			setFormData(initialFormData);
			setSubmitted(false);
			
			// Redirect after a brief delay
			setTimeout(() => {
				router.push("/sign-in");
				router.refresh();
			}, 1500);
		} catch {
			setServerError("Unable to create your account right now.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-10 text-slate-900">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.22),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.2),transparent_30%),radial-gradient(circle_at_60%_90%,rgba(16,185,129,0.2),transparent_34%)]" />

			<section className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-10">
				<div className="mb-7">
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">MGSI IMS</p>
					<h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Create your account</h1>
					<p className="mt-2 text-sm text-slate-600">Sign up to start managing inventory, suppliers, and reports in one place.</p>
				</div>

				<form className="space-y-4" onSubmit={handleSubmit} noValidate>
					<div className="space-y-1.5">
						<label htmlFor="fullName" className="text-sm font-semibold text-slate-800">
							Full Name
						</label>
						<input
							id="fullName"
							type="text"
							autoComplete="name"
							placeholder="Juan Dela Cruz"
							value={formData.fullName}
							onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))}
							className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
							required
						/>
						{submitted && formData.fullName.trim().length === 0 ? (
							<p className="text-xs text-rose-600">Please enter your full name.</p>
						) : null}
					</div>

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
							className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
							autoComplete="new-password"
							placeholder="At least 8 characters"
							value={formData.password}
							onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
							className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
							required
						/>
						{submitted && !passwordLongEnough ? (
							<p className="text-xs text-rose-600">Password must be at least 8 characters.</p>
						) : null}
					</div>

					<div className="space-y-1.5">
						<label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-800">
							Confirm Password
						</label>
						<input
							id="confirmPassword"
							type="password"
							autoComplete="new-password"
							placeholder="Re-enter your password"
							value={formData.confirmPassword}
							onChange={(event) => setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
							className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
							required
						/>
						{submitted && !passwordsMatch ? (
							<p className="text-xs text-rose-600">Passwords do not match.</p>
						) : null}
					</div>

					<label className="mt-1 flex items-start gap-3 text-sm text-slate-700">
						<input
							type="checkbox"
							checked={formData.termsAccepted}
							onChange={(event) => setFormData((prev) => ({ ...prev, termsAccepted: event.target.checked }))}
							className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
						/>
						<span>
							I agree to the <Link href="#" className="font-semibold text-emerald-700 hover:text-emerald-800">Terms</Link> and <Link href="#" className="font-semibold text-emerald-700 hover:text-emerald-800">Privacy Policy</Link>.
						</span>
					</label>
					{submitted && !formData.termsAccepted ? (
						<p className="text-xs text-rose-600">Please accept the terms to continue.</p>
					) : null}

					{serverError ? <p className="text-sm text-rose-600">{serverError}</p> : null}
					{serverSuccess ? <p className="text-sm text-emerald-700">{serverSuccess}</p> : null}

					<button
						type="submit"
						className="mt-2 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-300"
						disabled={isLoading || (!canSubmit && submitted)}
					>
						{isLoading ? "Creating Account..." : "Create Account"}
					</button>
				</form>

				<p className="mt-6 text-center text-sm text-slate-600">
					Already have an account?{" "}
					<Link href="/sign-in" className="font-semibold text-emerald-700 hover:text-emerald-800">
						Log in
					</Link>
				</p>
			</section>
		</main>
	);
}
