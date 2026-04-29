"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  error: string | null;
  sent: boolean;
};

export default function LoginForm({ error, sent }: Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSent, setLocalSent] = useState(sent);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);

    const isConfigured =
      typeof window !== "undefined" &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

    if (!isConfigured) {
      setLocalError(
        "Supabase isn't connected yet. Once it is, your magic link will work."
      );
      setSubmitting(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/console/auth/callback`,
        },
      });
      if (err) throw err;
      setLocalSent(true);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (localSent) {
    return (
      <div className="text-center py-3">
        <div className="mx-auto w-10 h-10 rounded-full bg-fern-200 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#2D5A3D"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-base font-semibold">Check your email.</h3>
        <p className="mt-2 text-sm text-muted">
          A one-time sign-in link is on its way to{" "}
          <span className="text-ink font-medium">{email || "your inbox"}</span>.
          It&rsquo;s good for 10 minutes.
        </p>
        <button
          onClick={() => setLocalSent(false)}
          className="mt-5 text-xs text-fern-800 hover:text-fern-900 font-medium"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-xs font-medium text-ink">Work email</span>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourbusiness.com"
          className="mt-1.5 w-full px-3 py-2.5 text-sm rounded-lg border border-rule focus:border-fern-700 focus:ring-2 focus:ring-fern-200 outline-none transition placeholder:text-muted"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-fern-800 hover:bg-fern-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
      >
        {submitting ? "Sending…" : "Send sign-in link"}
        {!submitting && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 7h8M8 4l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {(localError || error) && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {localError || error}
        </p>
      )}
    </form>
  );
}
