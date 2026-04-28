"use client";

import { useEffect, useState } from "react";

export type TocItem = {
  id: string;
  label: string;
};

type Props = {
  items: TocItem[];
};

export default function TableOfContents({ items }: Props) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // Pick the topmost visible section
          const top = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
          );
          setActive(top.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="sticky top-12 text-sm">
      <div className="text-xs uppercase tracking-[0.18em] text-fern font-medium mb-4">
        Contents
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`no-underline block leading-snug transition-colors border-l-2 pl-3 -ml-3 ${
                active === item.id
                  ? "text-ink border-fern"
                  : "text-muted border-transparent hover:text-ink"
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
