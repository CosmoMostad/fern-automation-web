import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Console · Fern Automation",
  description: "Your custom Fern console.",
};

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A1310] text-white">
      {children}
    </div>
  );
}
