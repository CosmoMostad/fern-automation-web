"use client";

/**
 * Lightweight markdown renderer for tournament-report bodies.
 * Handles H1/H2/H3, bold, italic, lists, code blocks. No external lib —
 * the report markdown comes from our own Claude prompts so we control
 * the syntax surface.
 */
type Block =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "code"; text: string };

export default function StudentReportRenderer({
  markdown,
}: {
  markdown: string;
}) {
  const blocks = parseMarkdown(markdown);
  return (
    <article>
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
                className="list-disc list-outside pl-5 my-3 space-y-1.5 text-sm text-white/85"
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
                className="list-decimal list-outside pl-5 my-3 space-y-1.5 text-sm text-white/85"
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
                className="bg-black/40 border border-white/10 rounded-md p-3 my-3 text-xs text-white/90 overflow-auto"
              >
                <code>{b.text}</code>
              </pre>
            );
          case "p":
            return (
              <p key={i} className="my-3 text-sm text-white/90 leading-relaxed">
                {renderInline(b.text)}
              </p>
            );
        }
      })}
    </article>
  );
}

function parseMarkdown(src: string): Block[] {
  const lines = (src || "").replace(/\r\n/g, "\n").split("\n");
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
