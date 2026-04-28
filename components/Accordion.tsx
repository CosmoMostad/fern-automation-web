"use client";

import { useState } from "react";

export type AccordionItem = {
  id?: string;
  title: string;
  /** Always-visible summary line, shown even when collapsed */
  tail?: React.ReactNode;
  children: React.ReactNode;
};

type Props = {
  items: AccordionItem[];
  /** If true, all items start expanded. Default false. */
  defaultOpen?: boolean;
};

export default function Accordion({ items, defaultOpen = false }: Props) {
  return (
    <div className="border-t border-rule">
      {items.map((item, i) => (
        <Row key={item.id ?? i} item={item} defaultOpen={defaultOpen} />
      ))}
    </div>
  );
}

function Row({
  item,
  defaultOpen,
}: {
  item: AccordionItem;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-rule">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-baseline justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-base md:text-lg leading-snug">
          {item.title}
        </span>
        <span
          className="text-muted text-lg leading-none flex-none w-4 text-center"
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="pb-6 max-w-prose space-y-3 text-base leading-relaxed">
          {item.children}
        </div>
      )}
      {!open && item.tail && (
        <div className="pb-5 -mt-2 text-sm text-muted">{item.tail}</div>
      )}
    </div>
  );
}
