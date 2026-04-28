type Phase = {
  phase: string;
  items: string[];
};

type Props = {
  phases: Phase[];
};

export default function BuildSequence({ phases }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 border-t border-ink">
      {phases.map((p, i) => (
        <div
          key={i}
          className={`py-5 md:py-6 px-4 md:px-5 border-b border-rule ${
            i < phases.length - 1 ? "md:border-r border-rule" : ""
          }`}
        >
          <h4 className="text-xs uppercase tracking-[0.16em] font-semibold mb-3">
            {p.phase}
          </h4>
          <ul className="space-y-1.5 text-sm leading-snug">
            {p.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
