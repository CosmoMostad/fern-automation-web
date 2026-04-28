type Props = {
  title: string;
  preparedFor: string;
  date: string;
  intro?: string;
};

export default function Hero({ title, preparedFor, date, intro }: Props) {
  return (
    <section className="mb-14">
      <div className="text-xs uppercase tracking-[0.18em] text-fern font-medium mb-6">
        Prepared for {preparedFor} · {date}
      </div>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">
        {title}
      </h1>
      {intro && (
        <p className="text-base md:text-lg leading-relaxed max-w-prose">
          {intro}
        </p>
      )}
    </section>
  );
}
