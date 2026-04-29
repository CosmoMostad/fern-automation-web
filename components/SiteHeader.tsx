"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DemoButton } from "./DemoProvider";

type Props = { variant?: "dark" | "light" };

export default function SiteHeader({ variant = "dark" }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark = variant === "dark";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
        scrolled
          ? isDark
            ? "bg-[rgba(6,9,10,0.78)] backdrop-blur-md border-b border-white/8"
            : "bg-white/85 backdrop-blur-md border-b border-rule"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-page mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          className={`plain flex items-center gap-2 font-medium tracking-tight ${
            isDark ? "text-white" : "text-ink"
          }`}
        >
          <FernMark dark={isDark} />
          fern automation
        </Link>

        <nav
          className={`hidden md:flex gap-7 text-sm ${
            isDark ? "text-white/75" : "text-ink/75"
          }`}
        >
          <a href="#how-it-works" className={`plain hover:${isDark ? "text-white" : "text-fern-800"}`}>
            How it works
          </a>
          <a href="#agents" className={`plain hover:${isDark ? "text-white" : "text-fern-800"}`}>
            Agents
          </a>
          <a href="#console" className={`plain hover:${isDark ? "text-white" : "text-fern-800"}`}>
            Console
          </a>
          <a href="#reviews" className={`plain hover:${isDark ? "text-white" : "text-fern-800"}`}>
            Reviews
          </a>
          <Link href="/notes" className={`plain hover:${isDark ? "text-white" : "text-fern-800"}`}>
            Notes
          </Link>
        </nav>

        <DemoButton variant="fern" className="!py-2 !px-4 text-sm">
          Get a demo
        </DemoButton>
      </div>
    </header>
  );
}

function FernMark({ dark }: { dark?: boolean }) {
  const stem = dark ? "#A8C49A" : "#1C3D2A";
  const leaf = dark ? "#7BB896" : "#52936B";
  return (
    <svg width="18" height="22" viewBox="0 0 22 26" aria-hidden>
      <path d="M11 1C11 1 4 7.5 4 13.5C4 17 6.5 20 11 21.5C15.5 20 18 17 18 13.5C18 7.5 11 1 11 1Z" fill={leaf} />
      <path d="M11 8C11 8 11 14 14 17" stroke={stem} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
