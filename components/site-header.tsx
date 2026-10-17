import Link from "next/link";

import { ThemePicker } from "@/components/theme-picker";
import { navigation } from "@/lib/site-content";

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-50 border-b">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6">
          <Link href="/#home" className="flex items-center gap-3" aria-label="SAI home">
            <div>
              <p className="font-mono text-xl font-semibold text-forest">SAI</p>
              <p className="text-sm text-ink/65">Character, creativity and responsible AI</p>
            </div>
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-2">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`rounded px-3 py-2 text-xs transition ${item.highlighted ? "bg-sky font-semibold text-forest hover:bg-sky/70" : "text-ink/75 hover:bg-mist hover:text-forest"}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <ThemePicker />
            <Link
            href="/#contact"
            className="rounded border border-sand px-5 py-3 text-sm font-medium text-forest transition hover:border-forest hover:bg-mist"
          >
            Contact
            </Link>
          </div>
        </div>

        <nav aria-label="Mobile primary" className="mt-4 lg:hidden">
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {navigation.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={`block rounded border px-3 py-2 text-xs transition ${item.highlighted ? "border-teal/25 bg-sky font-semibold text-forest" : "border-sand bg-paper text-ink/75 hover:border-forest/20 hover:text-forest"}`}
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
