import LoginForm from "./LoginForm";
import Link from "next/link";

export const metadata = {
  title: "Sign in · Fern Console",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; sent?: string };
}) {
  return (
    <div className="console-shell min-h-screen flex flex-col bg-[#0A1310] text-white">
      <header className="px-6 md:px-10 py-5 border-b border-white/8">
        <Link
          href="/"
          className="plain inline-flex items-center gap-2 font-medium text-white tracking-tight"
        >
          <svg width="18" height="22" viewBox="0 0 22 26" aria-hidden>
            <path
              d="M11 1C11 1 4 7.5 4 13.5C4 17 6.5 20 11 21.5C15.5 20 18 17 18 13.5C18 7.5 11 1 11 1Z"
              fill="#7BB896"
            />
            <path
              d="M11 8C11 8 11 14 14 17"
              stroke="#A8C49A"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          fern automation
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[400px]">
          <h1 className="text-2xl font-semibold tracking-tight text-white text-center">
            Welcome to your console.
          </h1>
          <p className="mt-2 text-sm text-white/65 text-center">
            Sign in with the email Fern has on file. We&rsquo;ll send a
            one-time link.
          </p>

          <div className="mt-8 bg-white text-ink rounded-2xl p-7 shadow-2xl">
            <LoginForm
              error={searchParams.error ?? null}
              sent={searchParams.sent === "1"}
            />
          </div>

          <p className="mt-6 text-xs text-white/55 text-center">
            Not a customer yet?{" "}
            <Link href="/" className="text-fern-300 hover:text-fern-200">
              Get a demo →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
