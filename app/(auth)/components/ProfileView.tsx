import React from "react";
import { CalendarDaysIcon, MailIcon, PhoneIcon, ShieldCheckIcon, UserIcon } from "lucide-react";

type LocalRole = "ADMIN" | "MANAGER" | "USER";

type CompanyOption = {
  id: string;
  name: string;
};

type ProfileViewProps = {
  userName: string;
  userEmail: string;
  userRole: LocalRole;
  userImage: string | null;
  userPhone: string;
  userCompanyId: string | null;
  availableCompanies: CompanyOption[];
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

function roleBadgeClass(role: LocalRole): string {
  switch (role) {
    case "ADMIN":
      return "bg-amber-100 text-amber-900 border-amber-300";
    case "MANAGER":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "USER":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
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
  userCompanyId,
  availableCompanies,
  userCreatedAt,
  lastLogin,
}: ProfileViewProps) {
  const companyName =
    availableCompanies.find((company) => company.id === userCompanyId)?.name ?? "Not assigned";

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main className="flex-1 w-full min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 bg-white">
      <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="relative border-b border-stone-200 bg-[linear-gradient(120deg,#0f172a,#1e293b_45%,#334155)] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(245,158,11,0.28),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(14,165,233,0.20),transparent_28%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/15 border border-white/25 text-white grid place-items-center font-bold text-xl sm:text-2xl overflow-hidden">
                {userImage ? (
                  <img src={userImage} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  initials || "U"
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-300 font-semibold">Profile</p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white tracking-tight">{userName}</h1>
                <p className="mt-1 text-sm text-slate-200">{userEmail}</p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${roleBadgeClass(
                userRole
              )}`}
            >
              <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {userRole}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard
              icon={<MailIcon className="h-4 w-4 text-amber-600" aria-hidden="true" />}
              label="Email"
              value={userEmail}
            />
            <InfoCard
              icon={<PhoneIcon className="h-4 w-4 text-amber-600" aria-hidden="true" />}
              label="Phone"
              value={userPhone.trim() ? userPhone : "Not set"}
            />
            <InfoCard
              icon={<UserIcon className="h-4 w-4 text-amber-600" aria-hidden="true" />}
              label="Company"
              value={companyName}
            />
            <InfoCard
              icon={<CalendarDaysIcon className="h-4 w-4 text-amber-600" aria-hidden="true" />}
              label="Joined"
              value={formatDate(userCreatedAt)}
            />
            <InfoCard
              icon={<CalendarDaysIcon className="h-4 w-4 text-amber-600" aria-hidden="true" />}
              label="Last Login"
              value={formatDate(lastLogin)}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

type InfoCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <article className="rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3.5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500 font-semibold">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-stone-900 break-words">{value}</p>
    </article>
  );
}
