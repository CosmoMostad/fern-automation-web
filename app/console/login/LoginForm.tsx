"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  error: string | null;
  sent: boolean;
};

type Stage = "enter_email" | "enter_code";

export default function LoginForm({ error }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("enter_email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // If the user clicks the magic link in another tab, this tab signs in
  // via localStorage broadcast — auto-redirect when that happens. (Magic
  // link is still a fallback in the email; OTP code is the primary UX.)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createSupabaseBrowserClient();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        window.location.href = "/console";
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/console";
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);

    const isConfigured =
      typeof window !== "undefined" &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (!isConfigured) {
      setLocalError("Supabase isn't connected yet.");
      setSubmitting(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          // Magic-link is still sent as a fallback (see effect above), but the
          // primary UX is the 6-digit code in the same email.
          emailRedirectTo: `${window.location.origin}/console/auth/callback`,
        },
      });
      if (err) throw err;
      setStage("enter_code");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setLocalError(null);

    const cleaned = code.replace(/\D/g, "").trim();
    if (cleaned.length !== 8) {
      setLocalError("Enter the 8-digit code from your email.");
      setVerifying(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: err } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: cleaned,
        type: "email",
      });
      if (err) throw err;
      // Hard redirect — Next.js cache + middleware see the new session.
      window.location.href = "/console";
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Code didn't verify. Try again."
      );
    } finally {
      setVerifying(false);
    }
  }

  if (stage === "enter_code") {
    return (
      <form onSubmit={verifyCode} className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-ink">Enter the code.</h3>
          <p className="mt-1.5 text-sm text-muted">
            We sent an 8-digit code to{" "}
            <span className="text-ink font-medium">{email}</span>. It expires in
            10 minutes.
          </p>
        </div>

        <CodeInput value={code} onChange={setCode} autoFocus />

        <button
          type="submit"
          disabled={verifying || code.replace(/\D/g, "").length !== 8}
          className="w-full bg-fern-800 hover:bg-fern-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          {verifying ? "Verifying…" : "Verify and sign in"}
        </button>

        {(localError || error) && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {localError || error}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setStage("enter_email");
              setCode("");
              setLocalError(null);
            }}
            className="text-fern-800 hover:text-fern-900 font-medium"
          >
            ← Use a different email
          </button>
          <button
            type="button"
            onClick={async () => {
              setSubmitting(true);
              setLocalError(null);
              try {
                const supabase = createSupabaseBrowserClient();
                const { error: err } = await supabase.auth.signInWithOtp({
                  email: email.trim(),
                  options: {
                    emailRedirectTo: `${window.location.origin}/console/auth/callback`,
                  },
                });
                if (err) throw err;
              } catch (err) {
                setLocalError(
                  err instanceof Error ? err.message : "Couldn't resend."
                );
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="text-muted hover:text-ink disabled:opacity-50"
          >
            {submitting ? "Resending…" : "Resend code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-4">
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
        {submitting ? "Sending…" : "Send sign-in code"}
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

      <p className="text-[11px] text-muted text-center pt-1">
        We&rsquo;ll email you an 8-digit code. Type it on the next screen.
      </p>

      {(localError || error) && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {localError || error}
        </p>
      )}
    </form>
  );
}

/* ───────────── 6-digit code input — Anthropic-style ───────────── */

function CodeInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const digits = value.replace(/\D/g, "").slice(0, 8).padEnd(8, " ").split("");

  function focusInput() {
    inputRef.current?.focus();
  }

  return (
    <div onClick={focusInput} className="cursor-text">
      <div className="flex items-center justify-between gap-2">
        {digits.map((d, i) => (
          <div
            key={i}
            className={`flex-1 aspect-[3/4] max-w-[52px] rounded-lg border bg-white flex items-center justify-center text-2xl font-mono tracking-tight transition ${
              d.trim()
                ? "border-fern-700 text-ink"
                : "border-rule text-muted/50"
            } ${
              i === Math.min(value.replace(/\D/g, "").length, 7) &&
              value.replace(/\D/g, "").length < 8
                ? "ring-2 ring-fern-200"
                : ""
            }`}
          >
            {d.trim() || ""}
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
          if (pasted) {
            e.preventDefault();
            onChange(pasted);
          }
        }}
        className="sr-only"
        aria-label="8-digit code"
      />
    </div>
  );
}
