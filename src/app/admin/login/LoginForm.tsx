"use client";

import { useState } from "react";

type LoginFormProps = {
  action: (formData: FormData) => void;
  next: string;
  supabaseAdminLoginEnabled: boolean;
};

export default function LoginForm({
  action,
  next,
  supabaseAdminLoginEnabled,
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
          {showPassword ? (
            <span aria-hidden="true" className="text-lg leading-none">
              ◉
            </span>
          ) : (
            <span aria-hidden="true" className="text-lg leading-none">
              ◌
            </span>
          )}
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
        <button
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
          name="mode"
          type="submit"
          value="password"
        >
          Use Temporary Password
        </button>
      </div>
    </form>
  );
}
