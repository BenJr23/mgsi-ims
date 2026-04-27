import React from "react";
import { CalendarDaysIcon, MailIcon, ShieldCheckIcon } from "lucide-react";

type LocalRole = "ADMIN" | "MANAGER" | "USER";

type ProfileViewProps = {
  userName: string;
  userEmail: string;
  userRole: LocalRole;
  userImage: string | null;
  userPhone: string;
  userCreatedAt: string | null;
  lastLogin: string | null;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function roleLabel(role: LocalRole): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function roleBadgeClass(role: LocalRole): string {
  switch (role) {
    case "ADMIN":
      return "bg-stone-900 text-white border-stone-900";
    case "MANAGER":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "USER":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default:
      return "bg-stone-100 text-stone-800 border-stone-300";
  }
}

export function ProfileView({
  userName,
  userEmail,
  userRole,
  userImage,
  userPhone,
  userCreatedAt,
  lastLogin,
}: ProfileViewProps) {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
        <header className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">My Profile</h1>
          <p className="text-sm text-stone-500">Review your account information and activity details.</p>
        </header>

        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-amber-400 via-amber-300 to-stone-200" />
          <div className="p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-stone-900 text-white grid place-items-center font-semibold text-lg overflow-hidden shrink-0 ring-4 ring-stone-100">
                  {userImage ? (
                    <img src={userImage} alt={userName} className="h-full w-full object-cover" />
                  ) : (
                    initials || "U"
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-stone-500">Account Holder</p>
                  <h2 className="mt-1 text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">{userName}</h2>
                  <div className="mt-2 inline-flex items-center gap-2 text-sm text-stone-600">
                    <MailIcon className="h-4 w-4 text-stone-400" aria-hidden="true" />
                    <span className="break-all">{userEmail}</span>
                  </div>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${roleBadgeClass(
                  userRole
                )}`}
              >
                <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {roleLabel(userRole)}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wide">Contact Information</h3>
                <dl className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Email</dt>
                    <dd className="sm:col-span-2 text-sm font-medium text-stone-900 break-all">{userEmail}</dd>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Phone</dt>
                    <dd className="sm:col-span-2 text-sm font-medium text-stone-900">
                      {userPhone.trim() ? userPhone : "Not set"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wide">Account Activity</h3>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-stone-600">
                      <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Joined</p>
                      <p className="text-sm font-semibold text-stone-900">{formatDate(userCreatedAt)}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Last Login</p>
                      <p className="text-sm font-semibold text-stone-900">{formatDateTime(lastLogin)}</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wide">Quick Summary</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <p className="text-xs uppercase tracking-wide font-semibold text-stone-500">Role</p>
              <p className="mt-1 text-sm font-semibold text-stone-900">{roleLabel(userRole)}</p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <p className="text-xs uppercase tracking-wide font-semibold text-stone-500">Phone Status</p>
              <p className="mt-1 text-sm font-semibold text-stone-900">
                {userPhone.trim() ? "Registered" : "Not Set"}
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <p className="text-xs uppercase tracking-wide font-semibold text-stone-500">Profile</p>
              <p className="mt-1 text-sm font-semibold text-stone-900">Active</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
