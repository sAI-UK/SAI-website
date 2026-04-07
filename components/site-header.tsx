import Link from "next/link";

import { navigation } from "@/lib/site-content";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-forest/10 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6">
          <Link href="#home" className="flex items-center gap-3">
            <div>
              <p className="font-serif text-2xl font-semibold text-forest">SAI</p>
              <p className="text-sm text-ink/65">Character, creativity and responsible AI</p>
            </div>
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-2">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-full px-4 py-2 text-sm text-ink/75 transition hover:bg-mist hover:text-forest"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link
            href="#contact"
            className="rounded-full border border-forest/15 px-5 py-3 text-sm font-medium text-forest transition hover:border-forest hover:bg-mist"
          >
            Contact
          </Link>
        </div>

        <nav aria-label="Mobile primary" className="mt-4 lg:hidden">
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {navigation.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className="block rounded-full border border-forest/10 bg-white px-4 py-2 text-sm text-ink/75 transition hover:border-forest/20 hover:text-forest"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
