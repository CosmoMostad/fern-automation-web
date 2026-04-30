/**
 * Shared Console chrome — Sidebar + TopBar + brand mark + icon set.
 * Used by Dashboard and per-agent detail pages so navigation stays consistent.
 *
 * Sidebar items are now real Links (Next.js routes), and the active item
 * is determined by `usePathname()` rather than a hardcoded prop.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/* ───────────── SIDEBAR ───────────── */

type NavSlug =
  | "agents"
  | "activity"
  | "inbox"
  | "escalations"
  | "voice"
  | "reports"
  | "settings";

const NAV: { slug: NavSlug; label: string; href: string; icon: ReactNode }[] = [
  { slug: "agents", label: "Agents", href: "/console", icon: <IconAgents /> },
  { slug: "activity", label: "Activity", href: "/console/activity", icon: <IconActivity /> },
  { slug: "inbox", label: "Inbox", href: "/console/inbox", icon: <IconInbox /> },
  { slug: "escalations", label: "Escalations", href: "/console/escalations", icon: <IconEscalations /> },
  { slug: "voice", label: "Voice", href: "/console/voice", icon: <IconVoice /> },
  { slug: "reports", label: "Reports", href: "/console/reports", icon: <IconReports /> },
];

export function Sidebar({ isDemo }: { isDemo: boolean }) {
  const pathname = usePathname() ?? "";
  const isActive = (href: string) =>
    href === "/console" ? pathname === "/console" || pathname.startsWith("/console/agents")
                        : pathname.startsWith(href);

  return (
    <aside className="border-r border-white/8 bg-[#06090A] p-4 flex flex-col gap-1">
      <Link href="/console" className="flex items-center gap-2 px-2 py-2 mb-3 plain">
        <FernMark />
        <span className="text-sm font-medium tracking-tight text-white">fern</span>
      </Link>

      {NAV.map((item) => (
        <NavLink
          key={item.slug}
          href={item.href}
          icon={item.icon}
          label={item.label}
          active={isActive(item.href)}
        />
      ))}

      <div className="mt-auto">
        <NavLink
          href="/console/settings/business"
          icon={<IconSettings />}
          label="Settings"
          active={pathname.startsWith("/console/settings")}
        />
        {isDemo ? (
          <Link
            href="/"
            className="plain flex items-center gap-2 mt-2 px-3 py-2 text-xs text-white/60 hover:text-white"
          >
            <ChevronLeft />
            back to fernautomation.com
          </Link>
        ) : (
          <form action="/console/auth/signout" method="post" className="mt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:text-white w-full text-left"
            >
              <SignoutGlyph />
              Sign out
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`plain flex items-center gap-2.5 px-3 py-2 rounded-md text-sm w-full text-left transition ${
        active
          ? "bg-white/8 text-white"
          : "text-white/55 hover:text-white hover:bg-white/4"
      }`}
    >
      <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
      {label}
    </Link>
  );
}

/* ───────────── TOP BAR ───────────── */

export function TopBar({
  business,
  user,
  isDemo,
  breadcrumb,
}: {
  business: string;
  user: string;
  isDemo: boolean;
  breadcrumb?: { label: string; href?: string }[];
}) {
  return (
    <header className="border-b border-white/8 px-6 flex items-center justify-between bg-[#0A1310] h-14">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium text-white">{business}</span>
        <Dot />
        {breadcrumb && breadcrumb.length > 0 ? (
          <>
            <Link href="/console" className="plain text-white/55 hover:text-white">
              Console
            </Link>
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-3">
                <Slash />
                {b.href ? (
                  <Link href={b.href} className="plain text-white/55 hover:text-white">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-white">{b.label}</span>
                )}
              </span>
            ))}
          </>
        ) : (
          <span className="text-xs text-white/55">Console</span>
        )}
        {isDemo && (
          <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-[#C89B3C] px-2 py-0.5 rounded bg-[#C89B3C]/15 border border-[#C89B3C]/25">
            Demo
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="text-xs text-white/55 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/5 transition">
          Help
        </button>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer transition">
          <div className="w-6 h-6 rounded-full bg-fern-700 text-white text-[10px] font-semibold flex items-center justify-center">
            {user.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-white/85">{user}</span>
          <Caret />
        </div>
      </div>
    </header>
  );
}

/* ───────────── ICONS + GLYPHS ───────────── */

const stroke = "currentColor";

export function FernMark() {
  return (
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
  );
}

function Dot() { return <span className="w-1 h-1 rounded-full bg-white/20" />; }
function Slash() { return <span className="text-white/25 font-mono">/</span>; }

function Caret() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2.5 4 L5 6.5 L7.5 4" stroke="currentColor" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" className="text-white/55" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M7 9L4 6l3-3" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignoutGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M5 9L8 6L5 3M8 6H1" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconAgents() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="4" height="4" rx="0.5" />
      <rect x="8" y="3" width="4" height="4" rx="0.5" />
      <rect x="2" y="9" width="4" height="3" rx="0.5" />
      <rect x="8" y="9" width="4" height="3" rx="0.5" />
    </svg>
  );
}
export function IconActivity() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7h2.5l1.5-3 2 6 1.5-3H12" />
    </svg>
  );
}
export function IconInbox() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8l1-5h8l1 5" />
      <path d="M2 8v3h10V8h-3l-1 1.5h-2L5 8H2z" />
    </svg>
  );
}
export function IconEscalations() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2L1.5 11.5h11L7 2z" />
      <path d="M7 6v3" />
      <path d="M7 10.5v.01" />
    </svg>
  );
}
export function IconVoice() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="4" height="7" rx="2" />
      <path d="M3 8a4 4 0 0 0 8 0" />
      <path d="M7 12v0" />
    </svg>
  );
}
export function IconReports() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="10" height="10" rx="1" />
      <path d="M5 9V6M7 9V4M9 9V7" />
    </svg>
  );
}
export function IconSettings() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="2" />
      <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M2.8 11.2l1.4-1.4M9.8 4.2l1.4-1.4" />
    </svg>
  );
}
