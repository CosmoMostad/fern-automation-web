type Props = {
  email: string;
  contactName: string;
  /** Optional override copy. Defaults to a generic kickoff prompt. */
  body?: React.ReactNode;
};

export default function NextSteps({ email, contactName, body }: Props) {
  return (
    <div className="border-t-2 border-fern pt-8 mt-8">
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
        Next steps
      </h2>
      <div className="max-w-prose space-y-4 text-base md:text-lg leading-relaxed">
        {body ?? (
          <p>
            If this looks right, reply to the email this proposal came in on,
            or reach out directly and we'll get kickoff scheduled this week.
          </p>
        )}
      </div>
      <div className="mt-6 text-base">
        <div className="font-medium">{contactName}</div>
        <a
          href={`mailto:${email}`}
          className="text-base"
        >
          {email}
        </a>
      </div>
    </div>
  );
}
