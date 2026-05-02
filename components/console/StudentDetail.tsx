"use client";

import { useState, useTransition } from "react";

import { generateTournamentReport } from "@/app/console/students/actions";
import type { Student, StudentReport } from "@/lib/supabase/types";

export default function StudentDetail({
  student,
  reports,
}: {
  student: Student;
  reports: StudentReport[];
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [openReportId, setOpenReportId] = useState<string | null>(
    reports[0]?.id ?? null
  );

  function onGenerate() {
    setErr(null);
    startTransition(async () => {
      const r = await generateTournamentReport(student.id);
      if (!r.ok) setErr(r.error);
    });
  }

  const openReport = reports.find((r) => r.id === openReportId) ?? null;

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Header card */}
      <div className="border border-white/8 rounded-lg p-6 bg-white/[0.02]">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{student.full_name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-white/55">
              {student.age !== null && <span>Age {student.age}</span>}
              {student.location && <span>· {student.location}</span>}
              {student.sport && <span>· {student.sport}</span>}
            </div>
            {student.current_rating !== null && (
              <div className="mt-3 inline-flex items-center gap-2 bg-fern-700/15 border border-fern-700/30 px-2.5 py-1 rounded-md">
                <span className="text-[10px] font-mono uppercase tracking-wider text-fern-300">
                  {student.current_rating_label ?? "Rating"}
                </span>
                <span className="text-sm font-semibold text-white">
                  {student.current_rating}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={onGenerate}
              disabled={pending}
              className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-40 text-white font-medium px-4 py-2 rounded-md transition"
            >
              {pending ? "Generating…" : "Generate tournament report"}
            </button>
            {err && <span className="text-xs text-red-400">{err}</span>}
          </div>
        </div>

        {(student.parent_name || student.parent_email) && (
          <div className="mt-4 pt-4 border-t border-white/8 text-sm text-white/55 flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/35">
              Parent
            </span>
            {student.parent_name && <span>{student.parent_name}</span>}
            {student.parent_email && <span>· {student.parent_email}</span>}
          </div>
        )}
      </div>

      {/* Reports section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mb-3">
            Reports
          </h2>
          {reports.length === 0 ? (
            <div className="text-sm text-white/45 border border-dashed border-white/10 rounded-md p-4">
              No reports yet. Click <em>Generate tournament report</em> to
              create one.
            </div>
          ) : (
            <div className="space-y-1.5">
              {reports.map((r) => {
                const active = r.id === openReportId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setOpenReportId(r.id)}
                    className={`w-full text-left px-3 py-2 rounded-md border text-sm transition ${
                      active
                        ? "bg-white/[0.04] border-white/20 text-white"
                        : "bg-white/[0.01] border-white/8 text-white/65 hover:text-white hover:border-white/15"
                    }`}
                  >
                    <div className="text-sm">
                      {r.report_type[0].toUpperCase() + r.report_type.slice(1)} report
                    </div>
                    <div className="mt-0.5 text-[11px] text-white/40">
                      {new Date(r.generated_at).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          {openReport ? (
            <div className="border border-white/8 rounded-lg bg-[#0E1A14] p-8">
              <ReportRenderer markdown={openReport.body_markdown} />
            </div>
          ) : (
            <div className="border border-dashed border-white/10 rounded-lg p-12 text-center text-sm text-white/45">
              Select a report on the left to view it here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Minimal markdown renderer — handles H1/H2/H3, bold, italic, lists,
 * code, and paragraph spacing. Good enough for tournament reports
 * without pulling in a full markdown lib.
 */
function ReportRenderer({ markdown }: { markdown: string }) {
  const blocks = parseMarkdown(markdown);
  return (
    <article className="prose-fern">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h1":
            return (
              <h1
                key={i}
                className="text-2xl font-semibold tracking-tight text-white mb-3"
              >
                {renderInline(b.text)}
              </h1>
            );
          case "h2":
            return (
              <h2
                key={i}
                className="text-base font-semibold text-white mt-7 mb-2 pb-1 border-b border-white/8"
              >
                {renderInline(b.text)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="text-sm font-semibold text-white mt-5 mb-1.5">
                {renderInline(b.text)}
              </h3>
            );
          case "ul":
            return (
              <ul
                key={i}
                className="list-disc list-outside pl-5 my-3 space-y-1.5 text-sm text-white/80"
              >
                {b.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={i}
                className="list-decimal list-outside pl-5 my-3 space-y-1.5 text-sm text-white/80"
              >
                {b.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre
                key={i}
                className="bg-black/40 border border-white/8 rounded-md p-3 my-3 text-xs text-white/85 overflow-auto"
              >
                <code>{b.text}</code>
              </pre>
            );
          case "p":
            return (
              <p key={i} className="my-3 text-sm text-white/80 leading-relaxed">
                {renderInline(b.text)}
              </p>
            );
        }
      })}
    </article>
  );
}

type Block =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "code"; text: string };

function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("```")) {
      i++;
      const buf: string[] = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: "code", text: buf.join("\n") });
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: line.slice(2).trim() });
      i++;
      continue;
    }
    if (line.match(/^[-*]\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }
    // Paragraph: collect until blank line
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("#") &&
      !lines[i].match(/^[-*]\s+/) &&
      !lines[i].match(/^\d+\.\s+/) &&
      !lines[i].startsWith("```")
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: buf.join(" ") });
  }
  return blocks;
}

function renderInline(text: string): React.ReactNode {
  // Order matters: code → bold → italic
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/;
  while (remaining.length) {
    const m = remaining.match(re);
    if (!m) {
      parts.push(remaining);
      break;
    }
    const idx = m.index ?? 0;
    if (idx > 0) parts.push(remaining.slice(0, idx));
    const matched = m[0];
    if (matched.startsWith("`")) {
      parts.push(
        <code
          key={`c${key++}`}
          className="px-1 py-0.5 rounded bg-white/10 text-xs text-fern-300 font-mono"
        >
          {matched.slice(1, -1)}
        </code>
      );
    } else if (matched.startsWith("**")) {
      parts.push(
        <strong key={`b${key++}`} className="font-semibold text-white">
          {matched.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <em key={`i${key++}`} className="italic">
          {matched.slice(1, -1)}
        </em>
      );
    }
    remaining = remaining.slice(idx + matched.length);
  }
  return parts;
}
