import Link from "next/link";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
}: PageHeroProps) {
  return (
    <section className="border-b border-sand bg-mist">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.06em] text-teal">
            {eyebrow}
          </p>
          <h1 className="mt-5 font-mono text-3xl leading-tight text-ink sm:text-[2.375rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/80">{description}</p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-wrap gap-4">
              {primaryCta ? (
                <Link
                  href={primaryCta.href}
                  className="rounded bg-forest px-6 py-3 text-sm font-medium text-white transition hover:bg-forest/90"
                >
                  {primaryCta.label}
                </Link>
              ) : null}
              {secondaryCta ? (
                <Link
                  href={secondaryCta.href}
                  className="rounded border border-sand px-6 py-3 text-sm font-medium text-forest transition hover:border-forest hover:bg-paper"
                >
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
