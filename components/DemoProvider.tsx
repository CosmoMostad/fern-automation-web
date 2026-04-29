"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import DemoModal from "./DemoModal";

type Ctx = { open: () => void; close: () => void; isOpen: boolean };
const DemoCtx = createContext<Ctx | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DemoCtx.Provider
      value={{
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        isOpen,
      }}
    >
      {children}
      <DemoModal open={isOpen} onClose={() => setIsOpen(false)} />
    </DemoCtx.Provider>
  );
}

export function useDemo() {
  const v = useContext(DemoCtx);
  if (!v) throw new Error("useDemo must be inside DemoProvider");
  return v;
}

type ButtonProps = {
  children: ReactNode;
  variant?: "fern" | "ghost-light" | "ghost-dark" | "naked";
  className?: string;
};

export function DemoButton({ children, variant = "fern", className = "" }: ButtonProps) {
  const { open } = useDemo();
  const cls =
    variant === "fern"
      ? "btn-fern"
      : variant === "ghost-light"
      ? "btn-ghost-light"
      : variant === "ghost-dark"
      ? "btn-ghost-dark"
      : "";
  return (
    <button onClick={open} className={`${cls} ${className}`}>
      {children}
    </button>
  );
}
