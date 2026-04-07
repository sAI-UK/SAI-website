type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-lg leading-8 text-ink/72">{description}</p>
    </div>
  );
}
