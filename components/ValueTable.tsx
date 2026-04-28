export type ValueRow = {
  name: string;
  math: string;
  impact: string;
};

type Props = {
  rows: ValueRow[];
  assumptions?: React.ReactNode;
};

export default function ValueTable({ rows, assumptions }: Props) {
  return (
    <div className="space-y-6">
      {assumptions && (
        <div className="border-l-2 border-ink pl-4 py-1 text-sm leading-relaxed">
          {assumptions}
        </div>
      )}
      <div className="border-t border-rule">
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 md:grid-cols-[1.3fr_2fr_1fr] gap-2 md:gap-4 py-4 border-b border-rule"
          >
            <div className="font-medium">{row.name}</div>
            <div className="text-sm md:text-base leading-relaxed text-ink/80">
              {row.math}
            </div>
            <div className="text-sm md:text-base font-medium md:text-right">
              {row.impact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
