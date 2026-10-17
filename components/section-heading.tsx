type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="section-heading max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.06em] text-teal">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-mono text-2xl leading-tight text-ink sm:text-[1.7rem]">
        {title}
      </h2>
      <p className="mt-5 text-lg leading-8 text-ink/80">{description}</p>
    </div>
  );
}
