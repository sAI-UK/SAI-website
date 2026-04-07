import Link from "next/link";

type CtaBandProps = {
  title: string;
  description: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
};

export function CtaBand({ title, description, primary, secondary }: CtaBandProps) {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-forest/10 bg-white px-8 py-12 shadow-card sm:px-12 lg:flex lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">
            Take the next step
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-forest">{title}</h2>
          <p className="mt-4 text-lg leading-8 text-ink/72">{description}</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-4 lg:mt-0 lg:justify-end">
          <Link
            href={primary.href}
            className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-white transition hover:bg-forest/90"
          >
            {primary.label}
          </Link>
          {secondary ? (
            <Link
              href={secondary.href}
              className="rounded-full border border-forest/15 px-6 py-3 text-sm font-medium text-forest transition hover:border-forest hover:bg-mist"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
