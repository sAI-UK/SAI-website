import Link from "next/link";

import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { navigation } from "@/lib/site-content";

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-50 border-b">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between gap-6">
          <Link href="/#home" className="flex shrink-0 items-center gap-4" aria-label="S³AI home">
            <Logo />
            <p className="hidden whitespace-nowrap text-sm text-ink/65 xl:block">Character, creativity and responsible AI</p>
          </Link>

          <nav aria-label="Primary" className="hidden flex-1 justify-center lg:flex">
            <ul className="flex items-center gap-1 xl:gap-2">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="whitespace-nowrap rounded px-3 py-2 text-sm text-ink/75 transition hover:bg-sky/60 hover:text-forest 2xl:text-base"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <ModeToggle />
            <Link
              href="/#contact"
              className="whitespace-nowrap rounded border border-sand px-5 py-3 text-sm font-medium text-forest transition hover:border-forest hover:bg-sky/60"
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
                  className="block whitespace-nowrap rounded border border-sand bg-paper px-3 py-2 text-sm text-ink/75 transition hover:border-forest/20 hover:text-forest"
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
