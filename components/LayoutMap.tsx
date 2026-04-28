export type LayoutColumn = {
  heading: string;
  items: string[];
};

type Props = {
  columns: LayoutColumn[];
};

const desktopCols: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
};

export default function LayoutMap({ columns }: Props) {
  const desktop = desktopCols[columns.length] ?? "md:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${desktop} gap-6 md:gap-8`}>
      {columns.map((col, i) => (
        <div key={i}>
          <h4 className="text-xs uppercase tracking-[0.14em] font-semibold pb-2 mb-3 border-b border-ink">
            {col.heading}
          </h4>
          <ul className="space-y-1.5 text-sm leading-snug">
            {col.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
