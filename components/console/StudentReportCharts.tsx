"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Chart strip rendered above the markdown narrative on a tournament
 * report. Reads structured data the agent (or seed) wrote into
 * student_reports.source_data:
 *
 *   {
 *     "ratingHistory":     [{ date: "2026-01-15", rating: 5.2 }, ...]
 *     "recentMatches":     [{ date, opponent, score, opponentRating, win }, ...]
 *     "opponentQualityVs": "Average opponent rating per recent match"   // optional caption
 *   }
 *
 * Missing keys → that chart is skipped silently. Fully missing source_data
 * just means no charts and the markdown carries the report alone.
 */
type RatingPoint = { date: string; rating: number };
type Match = {
  date: string;
  opponent: string;
  score?: string;
  opponentRating?: number | null;
  win?: boolean;
};

const FERN = "#7BB896";
const FERN_DIM = "#52936B";
const AMBER = "#E8B85E";

export default function StudentReportCharts({
  sourceData,
}: {
  sourceData: Record<string, unknown> | null | undefined;
}) {
  const data = sourceData ?? {};
  const ratingHistory = readArray<RatingPoint>(data, "ratingHistory");
  const recentMatches = readArray<Match>(data, "recentMatches");

  if (ratingHistory.length === 0 && recentMatches.length === 0) {
    return null;
  }

  const opponentChart = recentMatches
    .filter((m) => typeof m.opponentRating === "number")
    .slice(0, 8)
    .reverse()
    .map((m) => ({
      label: m.opponent.split(" ").slice(-1)[0] || "Opp",
      opponentRating: m.opponentRating as number,
      result: m.win ? "W" : "L",
    }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {ratingHistory.length > 0 && (
        <ChartCard title="Rating trajectory" subtitle="Last 6 months">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={ratingHistory} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.45)"
                tick={{ fontSize: 11 }}
                tickFormatter={(s) =>
                  new Date(s).toLocaleDateString(undefined, { month: "short" })
                }
              />
              <YAxis
                stroke="rgba(255,255,255,0.45)"
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "#0A1310",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  color: "white",
                  fontSize: 12,
                }}
                labelFormatter={(s) =>
                  new Date(s as string).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                  })
                }
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke={FERN}
                strokeWidth={2}
                dot={{ fill: FERN, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {opponentChart.length > 0 && (
        <ChartCard title="Recent opponent quality" subtitle={`Last ${opponentChart.length} matches`}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={opponentChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.45)"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.45)"
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "#0A1310",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  color: "white",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="opponentRating"
                fill={FERN_DIM}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {recentMatches.length > 0 && (
        <div className="md:col-span-2 border border-white/10 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Recent matches</h4>
            <span className="text-xs text-white/65">
              {recentMatches.length} matches
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-xs text-white/65">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Date</th>
                <th className="text-left px-4 py-2 font-medium">Opponent</th>
                <th className="text-left px-4 py-2 font-medium">Rating</th>
                <th className="text-left px-4 py-2 font-medium">Score</th>
                <th className="text-left px-4 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {recentMatches.slice(0, 10).map((m, i) => (
                <tr key={i} className="border-t border-white/8">
                  <td className="px-4 py-2.5 text-white/85">
                    {formatShortDate(m.date)}
                  </td>
                  <td className="px-4 py-2.5 text-white">{m.opponent}</td>
                  <td className="px-4 py-2.5 text-white/85">
                    {m.opponentRating ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-white/85 font-mono text-xs">
                    {m.score ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {m.win === true && (
                      <span className="text-xs font-semibold text-fern-300 bg-fern-700/15 border border-fern-700/30 px-2 py-0.5 rounded">
                        W
                      </span>
                    )}
                    {m.win === false && (
                      <span className="text-xs font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                        L
                      </span>
                    )}
                    {m.win === undefined && (
                      <span className="text-xs text-white/55">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        {subtitle && (
          <span className="text-xs text-white/65">{subtitle}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function readArray<T>(obj: Record<string, unknown>, key: string): T[] {
  const v = obj[key];
  if (Array.isArray(v)) return v as T[];
  return [];
}

function formatShortDate(s: string | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return s;
  }
}
