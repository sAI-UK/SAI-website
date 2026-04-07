import Link from "next/link";

import { contactEmail, navigation } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-forest/10 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.3fr_0.7fr] lg:px-8">
        <div className="max-w-2xl">
          <p className="font-serif text-3xl text-forest">SAI</p>
          <p className="mt-4 text-base leading-8 text-ink/72">
            A UK-based education and social impact initiative developing a thoughtful,
            values-led approach to children&apos;s character, creativity and responsible AI
            awareness.
          </p>
          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">
              Contact
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-3 inline-flex text-lg text-forest underline decoration-forest/30 underline-offset-4"
            >
              {contactEmail}
            </a>
            <p className="mt-3 max-w-xl text-sm leading-7 text-ink/65">
              For funding conversations, early school interest, pilot enquiries or wider
              partnership discussions.
            </p>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-1">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-forest/80">
              Explore
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-ink/75">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition hover:text-forest">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
