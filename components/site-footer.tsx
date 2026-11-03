import Link from "next/link";

import { BirdFlock } from "@/components/ballpoint/bird-flock";
import { ChimneySmoke, FarmLights } from "@/components/ballpoint/chimney-smoke";
import { ArtPicture, MeadowClouds } from "@/components/ballpoint/sky";
import { WindGrass } from "@/components/ballpoint/wind-grass";
import { Logo } from "@/components/logo";
import { contactEmail, navigation } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="ground-zone">
      {/* The ground: the page's descent from the stars lands here. */}
      {/* On the homepage this holds the meadow in view for a moment as you land (see SkyDrift). */}
      <div className="meadow-pin">
        <div className="meadow-scene">
          <div className="meadow-stage">
            <MeadowClouds />
            <BirdFlock count={4} seed={11} start={0.3} scale={0.72} drift={false} className="bird-flock-meadow" />
            <BirdFlock count={3} seed={29} start={0.78} scale={0.6} drift={false} className="bird-flock-meadow bird-flock-meadow-high" />
            <ArtPicture
              className="meadow"
              desktop={{ src: "/ballpoint/meadow.webp", width: 1900, height: 790 }}
              mobile={{ src: "/ballpoint/meadow-mobile.webp", width: 640, height: 560 }}
              alt="Ballpoint drawing of cows grazing in rolling meadows, with dry stone walls and big clouds overhead."
            />
            <ChimneySmoke />
            <FarmLights />
          </div>
        </div>
      </div>

      {/* The grass carries on to a timber fence, and the footer text is written on the fence. */}
      <div className="ground">
        <div className="fence">
          <div className="fence-top" />
          <div className="fence-boards">
            <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.3fr_1fr_0.8fr] lg:px-8">
              <div>
                <Logo />
                <p className="mt-3 text-sm leading-6 text-ink/85">
                  A UK-based education and social impact initiative developing a thoughtful,
                  values-led approach to children&apos;s character, creativity and responsible AI
                  awareness.
                </p>
              </div>
              <div>
                <p className="eyebrow">Contact</p>
                <a
                  href={`mailto:${contactEmail}`}
                  className="mt-2 inline-flex text-forest underline decoration-forest/30 underline-offset-4"
                >
                  {contactEmail}
                </a>
                <p className="mt-2 text-sm leading-6 text-ink/80">
                  For funding conversations, early school interest, pilot enquiries or wider
                  partnership discussions.
                </p>
              </div>
              <div>
                <h2 className="eyebrow">Explore</h2>
                <ul className="mt-2 space-y-1 text-sm text-ink/85">
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
        </div>
      </div>
      <WindGrass />
    </footer>
  );
}
