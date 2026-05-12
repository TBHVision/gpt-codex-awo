"use client";

import { useState } from "react";

type LoginFormProps = {
  action: (formData: FormData) => void;
  next: string;
  supabaseAdminLoginEnabled: boolean;
  temporaryPasswordEnabled: boolean;
  temporaryPasswordProductionRisk: boolean;
};

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {crossed ? (
        <path
          d="M4 20 20 4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      ) : null}
    </svg>
  );
}

export default function LoginForm({
  action,
  next,
  supabaseAdminLoginEnabled,
  temporaryPasswordEnabled,
  temporaryPasswordProductionRisk,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="mt-5 space-y-4">
      <input name="next" type="hidden" value={next} />
      {supabaseAdminLoginEnabled ? (
        <div>
          <label
            className="block text-sm font-semibold text-slate-700"
            htmlFor="admin-email"
          >
            Admin email
          </label>
          <input
            autoComplete="email"
            className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none focus:border-slate-950"
            id="admin-email"
            name="email"
            type="email"
          />
        </div>
      ) : null}
      <label
        className="block text-sm font-semibold text-slate-700"
        htmlFor="admin-password"
      >
        Password
      </label>
      <div className="mt-2 flex h-11 w-full items-center rounded-md border border-slate-300 bg-white focus-within:border-slate-950">
        <input
          autoComplete="current-password"
          className="h-full min-w-0 flex-1 rounded-md px-3 text-base outline-none"
          id="admin-password"
          name="password"
          required
          type={showPassword ? "text" : "password"}
        />
        <button
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="flex h-full w-11 items-center justify-center text-slate-500 hover:text-slate-950"
          onClick={() => setShowPassword((value) => !value)}
          type="button"
        >
          <EyeIcon crossed={showPassword} />
        </button>
      </div>
      <div className="space-y-3">
        {supabaseAdminLoginEnabled ? (
          <button
            className="h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            name="mode"
            type="submit"
            value="supabase"
          >
            Sign in as Admin
          </button>
        ) : null}
        {temporaryPasswordEnabled ? (
          <div className="space-y-2">
            {temporaryPasswordProductionRisk ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-950">
                Temporary password fallback is still enabled in production.
                Prefer named Supabase admin login before launch.
              </p>
            ) : null}
            <button
              className={`h-11 w-full rounded-md border px-4 text-sm font-semibold shadow-sm ${
                temporaryPasswordProductionRisk
                  ? "border-amber-300 bg-amber-50 text-amber-950 hover:border-amber-400 hover:bg-amber-100"
                  : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
              }`}
              name="mode"
              type="submit"
              value="password"
            >
              Use Temporary Password{temporaryPasswordProductionRisk ? " (Pre-launch)" : ""}
            </button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
