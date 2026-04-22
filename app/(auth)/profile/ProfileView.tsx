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
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-8 space-y-8 max-w-400 mx-auto w-full">
        <header>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Profile</h1>
          <p className="text-sm text-stone-500 mt-1">Review your account information and activity details.</p>
        </header>

        <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-xl bg-stone-900 text-white grid place-items-center font-semibold text-lg overflow-hidden shrink-0">
                {userImage ? (
                  <img src={userImage} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  initials || "U"
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide font-semibold text-stone-500">Account Holder</p>
                <h2 className="mt-1 text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">{userName}</h2>
                <p className="mt-1 text-sm text-stone-600 break-all">{userEmail}</p>
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
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <InfoCard
            icon={<MailIcon className="h-4 w-4 text-stone-500" aria-hidden="true" />}
            label="Email"
            value={userEmail}
          />
          <InfoCard
            icon={<PhoneIcon className="h-4 w-4 text-stone-500" aria-hidden="true" />}
            label="Phone"
            value={userPhone.trim() ? userPhone : "Not set"}
          />
          <InfoCard
            icon={<UserIcon className="h-4 w-4 text-stone-500" aria-hidden="true" />}
            label="Company"
            value={companyName}
          />
          <InfoCard
            icon={<CalendarDaysIcon className="h-4 w-4 text-stone-500" aria-hidden="true" />}
            label="Joined"
            value={formatDate(userCreatedAt)}
          />
          <InfoCard
            icon={<CalendarDaysIcon className="h-4 w-4 text-stone-500" aria-hidden="true" />}
            label="Last Login"
            value={formatDate(lastLogin)}
          />
        </section>
      </main>
    </div>
  );
}

type InfoCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <article className="bg-white rounded-xl border border-stone-200 shadow-sm px-4 py-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500 font-semibold">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-stone-900 wrap-break-word">{value}</p>
    </article>
  );
}
