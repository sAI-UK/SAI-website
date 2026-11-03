import Image from "next/image";

import { BirdFlock } from "@/components/ballpoint/bird-flock";
import { PenPad } from "@/components/ballpoint/pen-pad";
import { GravityScroll } from "@/components/ballpoint/gravity-scroll";
import { InkCard, SketchBox, WordMark } from "@/components/ballpoint/sketch";
import { Aeroplane, CloudDeck, DistantPlane, Rocket, SkyArt, SkyGapCloud, Stars, WindCloud } from "@/components/ballpoint/sky";
import { SkyDrift } from "@/components/ballpoint/sky-drift";
import { StarMotion } from "@/components/ballpoint/star-motion";
import { SectionHeading } from "@/components/section-heading";
import {
  contactEmail,
  enrichmentPoints,
  responsibleAiPrinciples,
  trustPrinciples,
  values,
} from "@/lib/site-content";

// The page reads as one descent: stars, then an aeroplane and thin high cloud,
// then clouds that grow on the way down, birds near the ground, and the meadow in the footer.
export default function HomePage() {
  return (
    <div className="home-sky">
      <SkyDrift />
      <GravityScroll />

      {/* Space */}
      <section id="home" className="sky-hero">
        {/* Stars stop at the cloud layer */}
        <div className="star-field">
          <Stars />
          <StarMotion />
        </div>
        <Rocket />
        <div className="hero-inner mx-auto px-4 sm:px-6">
          <p className="eyebrow">UK education and social impact initiative</p>
          <h1>
            Helping children build <WordMark kind="circle">character</WordMark>, <WordMark kind="underline">creativity</WordMark> and{" "}
            <WordMark kind="hatch">confidence</WordMark> through storytelling and responsible AI
          </h1>
          <p className="hero-lede">
            SAI is a UK-based education and social impact initiative developing after-school enrichment experiences for
            children. Our approach combines values-based learning, storytelling, creative expression and responsible AI
            awareness in a format designed for schools, families and communities.
          </p>
          <div className="hero-actions">
            <a className="ink-button ink-button-solid" href={`mailto:${contactEmail}`}>Partner with SAI</a>
            <a className="ink-button" href="#contact">
              <SketchBox variant={1} />
              Enquire about pilot opportunities
            </a>
          </div>
          <a href="#discover" className="hand-note scroll-invitation">
            <span aria-hidden="true">↓</span> A little scroll. A world of possibilities.
          </a>
        </div>
        {/* The plane flies between the two cloud layers */}
        {/* The plane is first, so it sinks behind the clouds as you scroll down */}
        <Aeroplane />
        <CloudDeck />
        <CloudDeck front />
      </section>

      {/* Resting on the clouds */}
      <section className="sky-section sky-section-tight">
        <div className="sky-wrap grid gap-8 lg:grid-cols-2">
          <InkCard as="article" tape>
            <p className="eyebrow">Why it matters</p>
            <p className="mt-4 text-lg leading-8 text-ink/80">
              Children are growing up in a changing digital world. They need strong values and future-facing confidence,
              with adults helping them engage thoughtfully rather than passively with new tools.
            </p>
          </InkCard>
          <InkCard as="article" tape tilt variant={1}>
            <p className="eyebrow">Built for</p>
            <p className="mt-4 text-lg leading-8 text-ink/80">
              Funding authorities, grant partners, schools, parents and community organisations looking for a calm,
              credible and responsible model.
            </p>
          </InkCard>
        </div>
      </section>

      {/* High, thin cloud */}
      <section id="discover" className="sky-section sky-below-clouds">
        <SkyGapCloud cloud={1} side="right" />
        <SkyArt name="wisp-1" side="right" top="42%" />
        <SkyArt name="wisp-3" side="left" top="72%" />
        <div className="sky-wrap grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <SectionHeading
            eyebrow="What we do"
            title="A values-led enrichment model built around story, reflection and guided creativity."
            description="SAI is being developed to help children explore core values, discuss stories and choices, build confidence through creative expression and engage with AI-supported tools in an age-appropriate way."
          />
          <div className="grid gap-5">
            {enrichmentPoints.map((point, index) => (
              <InkCard key={point} className="ink-step" variant={index}>
                <span className="ink-step-number" aria-hidden="true">0{index + 1}</span>
                <p>{point}</p>
              </InkCard>
            ))}
          </div>
        </div>
      </section>

      <section className="sky-section">
        <SkyGapCloud cloud={2} side="left" />
        <SkyArt name="wisp-2" side="left" top="10%" />
        <SkyArt name="wisp-1" side="right" top="66%" />
        <WindCloud cloud={2} seconds={58} start={0.6} />
        <DistantPlane seconds={85} start={0.3} />
        <SkyArt name="balloon" side="right" top="20%" />
        <SkyArt name="cloud-f" side="left" top="58%" />
        <div className="sky-wrap grid gap-12 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Why now"
            title="The future will involve AI and digital tools. Children should be prepared to engage with them thoughtfully and responsibly."
            description="SAI takes a calm view of this moment. The aim is not to add hype, but to help children build judgement, confidence and creative agency with strong adult guidance."
          />
          <InkCard as="article" tape variant={2} className="ink-card-roomy">
            <p className="eyebrow">A clear principle</p>
            <p className="pull-quote">Children do the thinking. Technology supports creativity and reflection.</p>
            <p className="mt-5 text-base leading-8 text-ink/80">
              That principle shapes the programme concept, the safeguarding stance and the way SAI speaks to schools,
              families and funding partners.
            </p>
          </InkCard>
        </div>
      </section>

      {/* The first small clouds */}
      <section id="about" className="sky-section">
        <SkyGapCloud cloud={3} side="right" />
        <SkyArt name="wisp-3" side="right" top="6%" />
        <SkyArt name="cloud-f" side="left" top="42%" />
        <WindCloud cloud={3} seconds={66} start={0.35} />
        <SkyArt name="cloud-e" side="right" top="58%" />
        <SkyArt name="cloud-e" side="left" top="82%" />
        <div className="sky-wrap">
          <SectionHeading
            eyebrow="About"
            title="A thoughtful idea built on the belief that children need both strong values and future-facing skills."
            description="SAI is a UK-based education and social impact initiative being developed to help children grow in character, creativity and confidence through storytelling and responsible AI."
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <InkCard as="article" variant={1}>
              <p className="eyebrow">Intro</p>
              <h2 className="card-title">What SAI is and why it exists</h2>
              <p className="mt-5 text-base leading-8 text-ink/80">
                SAI is being developed as a calm, credible response to a changing world. It starts from a simple belief:
                children should be supported to grow in character and creativity while also gaining confidence around the
                tools shaping their future.
              </p>
            </InkCard>
            <InkCard as="article" variant={2}>
              <p className="eyebrow">Founding idea</p>
              <h2 className="card-title">Values and future-facing skills should grow together</h2>
              <p className="mt-5 text-base leading-8 text-ink/80">
                SAI does not see these as competing aims. Character, reflection, imagination and digital confidence all
                belong together when children are learning to navigate the world around them.
              </p>
            </InkCard>
          </div>
        </div>
      </section>

      <section className="sky-section">
        <SkyGapCloud cloud={1} side="left" />
        <SkyArt name="cloud-e" side="right" top="14%" />
        <WindCloud cloud={1} seconds={50} start={0.8} />
        <SkyArt name="cloud-f" side="left" top="4%" />
        <SkyArt name="cloud-d" side="left" top="66%" />
        <SkyArt name="cloud-c" side="right" top="62%" />
        <div className="sky-wrap grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Why storytelling</p>
            <h2 className="section-title">Stories help children explore values, identity and self-expression in human terms.</h2>
            <p className="mt-5 text-lg leading-8 text-ink/80">
              Through storytelling, children can discuss choices, feelings and relationships before moving into creative
              work. It is a natural way to explore what matters and how values show up in everyday life.
            </p>
          </div>
          <ul className="value-list">
            {values.map((value, index) => (
              <li key={value}>
                <Image src={`/ballpoint/pebble-${(index % 4) + 1}.webp`} width={52} height={52} alt="" unoptimized />
                {value}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Fuller clouds */}
      <section className="sky-section">
        <SkyGapCloud cloud={2} side="right" />
        <SkyArt name="cloud-d" side="left" top="-6%" />
        <SkyArt name="cloud-f" side="right" top="52%" />
        <WindCloud cloud={2} seconds={62} start={0.25} />
        <BirdFlock count={4} seed={21} start={0.7} scale={0.7} className="bird-flock-top" />
        <SkyArt name="cloud-e" side="left" top="62%" />
        <SkyArt name="cloud-c" side="right" top="-2%" />
        <div className="sky-wrap grid gap-8 lg:grid-cols-2">
          <InkCard as="article" tape>
            <p className="eyebrow">Why responsible AI</p>
            <p className="mt-4 text-base leading-8 text-ink/80">
              SAI is interested in helping children engage with emerging technology in a way that is thoughtful, creative
              and grounded. The goal is not passive use, but guided exploration where children keep their own voice and
              judgement.
            </p>
          </InkCard>
          <InkCard as="article" tape tilt variant={1}>
            <p className="eyebrow">Inclusion and confidence</p>
            <p className="mt-4 text-base leading-8 text-ink/80">
              SAI has a strong interest in helping girls and underrepresented young people see themselves as creators and
              future leaders in technology, not simply users of tools built by others.
            </p>
          </InkCard>
        </div>
      </section>

      <section className="sky-section">
        <SkyGapCloud cloud={3} side="left" />
        <SkyArt name="cloud-c" side="right" top="-10%" />
        <SkyArt name="cloud-e" side="left" top="38%" />
        <WindCloud cloud={3} seconds={46} start={0.5} />
        <SkyArt name="cloud-d" side="left" top="-16%" />
        <SkyArt name="cloud-f" side="right" top="66%" />
        <div className="sky-wrap grid gap-8 lg:grid-cols-2">
          <InkCard as="article" variant={2} className="ink-card-roomy">
            <p className="eyebrow">Mission</p>
            <p className="pull-quote">To help children build character, creativity and confidence through storytelling and responsible AI.</p>
          </InkCard>
          <InkCard as="article" className="ink-card-roomy">
            <p className="eyebrow">Vision</p>
            <p className="pull-quote">
              A future where children, especially girls and underrepresented young people, can engage with emerging
              technology as thoughtful, ethical and confident creators.
            </p>
          </InkCard>
        </div>
      </section>

      <section className="sky-section">
        <SkyGapCloud cloud={1} side="right" />
        <SkyArt name="cloud-d" side="right" top="-4%" />
        <SkyArt name="cloud-c" side="left" top="30%" />
        <WindCloud cloud={1} seconds={54} start={0.1} />
        <BirdFlock count={5} seed={33} start={0.1} scale={0.8} className="bird-flock-top" />
        <SkyArt name="balloon" side="left" top="6%" />
        <SkyArt name="cloud-e" side="right" top="64%" />
        <SkyArt name="cloud-f" side="left" top="74%" />
        <div className="sky-wrap">
          <SectionHeading
            eyebrow="Trust and principles"
            title="SAI is being built around credibility, care and child-centred design."
            description="Visitors should be able to see clearly that safeguarding and careful AI use are not side notes. They are central to the model."
          />
          <div className="mt-12 grid grid-cols-2 gap-4 md:gap-5 xl:grid-cols-5">
            {trustPrinciples.map((principle, index) => (
              <InkCard key={principle} variant={index} className="ink-principle">
                <p>{principle}</p>
              </InkCard>
            ))}
          </div>
        </div>
      </section>

      {/* Big, low cloud */}
      <section id="safeguarding" className="sky-section">
        <SkyGapCloud cloud={2} side="left" />
        <SkyArt name="cloud-a" side="left" top="3%" />
        <SkyArt name="cloud-c" side="right" top="24%" />
        <SkyArt name="cloud-d" side="left" top="72%" />
        <WindCloud cloud={2} seconds={44} start={0.7} />
        <SkyArt name="cloud-e" side="left" top="38%" />
        <SkyArt name="cloud-f" side="right" top="4%" />
        <SkyArt name="cloud-a" side="right" top="84%" />
        <SkyArt name="cloud-c" side="left" top="88%" />
        <div className="sky-wrap">
          <SectionHeading
            eyebrow="Safeguarding & Responsible AI"
            title="Safeguarding is central to the SAI model, not an afterthought."
            description="SAI is being developed with child wellbeing, age-appropriate practice and careful use of technology at its core."
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <InkCard as="article" tape>
              <p className="eyebrow">Safeguarding approach</p>
              <h2 className="card-title">A safeguarding-first mindset from the beginning</h2>
              <ul className="ink-list">
                <li>Child wellbeing remains central to activity design.</li>
                <li>Experiences are intended to be age-appropriate and clearly guided.</li>
                <li>Adult oversight, clear boundaries and safe practice matter throughout.</li>
                <li>Inclusive participation is part of responsible delivery.</li>
              </ul>
            </InkCard>
            <InkCard as="article" tape tilt variant={1} className="ink-card-roomy">
              <p className="eyebrow">A core principle</p>
              <p className="pull-quote">
                Technology is intended to support creativity and reflection, not replace children&apos;s thinking or voice.
              </p>
            </InkCard>
          </div>

          <div className="mt-14 max-w-3xl">
            <p className="eyebrow">Responsible AI approach</p>
            <h2 className="section-title">Careful use, clear boundaries and critical thinking over passive use.</h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:gap-5 xl:grid-cols-3">
            {responsibleAiPrinciples.map((principle, index) => (
              <InkCard key={principle} as="article" variant={index} className="ink-principle">
                <p>{principle}</p>
              </InkCard>
            ))}
          </div>

          <InkCard className="mt-12" variant={2}>
            <p className="eyebrow">Privacy and transparency</p>
            <h2 className="card-title">
              Schools, families and partners should understand what tools are used, how they are used and why they are used.
            </h2>
            <p className="mt-5 max-w-4xl text-base leading-8 text-ink/80">
              SAI aims to keep communication clear and grounded. That includes careful tool choices, straightforward
              explanation, and an approach that avoids unnecessary personal data wherever possible.
            </p>
          </InkCard>
        </div>
      </section>

      {/* The first birds */}
      <section id="concept" className="sky-section">
        <SkyGapCloud cloud={3} side="right" />
        <BirdFlock count={5} seed={42} start={0.2} scale={0.85} className="bird-flock-top" />
        <SkyArt name="cloud-b" side="left" top="8%" />
        <SkyArt name="cloud-a" side="right" top="44%" />
        <WindCloud cloud={3} seconds={40} start={0.3} />
        <SkyArt name="cloud-d" side="left" top="50%" />
        <SkyArt name="cloud-c" side="right" top="6%" />
        <SkyArt name="cloud-e" side="left" top="84%" />
        <div className="sky-wrap">
          <div className="max-w-3xl">
            <p className="eyebrow">Concept · Ballpoint mode</p>
            <h2 className="section-title">The same pen, in children&apos;s hands.</h2>
            <p className="mt-5 text-lg leading-8 text-ink/80">
              A child draws only the outline and the pen adds light and shadow. Ready-made pieces, like trees, sit alongside
              their own drawings in one consistent style.
            </p>
          </div>
          <div className="mt-10">
            <PenPad />
          </div>
        </div>
      </section>

      {/* Just above the ground */}
      <section id="contact" className="sky-section sky-landing">
        <SkyGapCloud cloud={1} side="left" />
        <SkyArt name="cloud-a" side="left" top="4%" />
        <SkyArt name="cloud-c" side="right" top="18%" />
        <WindCloud cloud={1} seconds={36} start={0.55} />
        <SkyArt name="cloud-b" side="right" top="58%" />
        <div className="sky-wrap text-center">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow">Get in touch</p>
            <h2 className="section-title">Interested in piloting SAI or supporting the programme?</h2>
            <p className="mt-5 text-lg leading-8 text-ink/80">
              We would like to hear from schools, community settings and funding partners who share this approach.
            </p>
          </div>
          <div className="hero-actions">
            <a className="ink-button ink-button-solid" href={`mailto:${contactEmail}`}>{contactEmail}</a>
            <a className="ink-button" href={`mailto:${contactEmail}?subject=Pilot%20enquiry`}>
              <SketchBox variant={2} />
              Enquire about a pilot
            </a>
          </div>
        </div>
        <BirdFlock count={7} seed={7} start={0.55} className="bird-flock-bottom" />
      </section>
    </div>
  );
}
