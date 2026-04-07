import { SectionHeading } from "@/components/section-heading";
import {
  contactEmail,
  enrichmentPoints,
  responsibleAiPrinciples,
  trustPrinciples,
  values,
} from "@/lib/site-content";

export default function HomePage() {
  return (
    <>
      <section id="home" className="border-b border-forest/10 bg-mist scroll-mt-28">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal">
              UK education and social impact initiative
            </p>
            <h1 className="mt-6 font-serif text-5xl leading-tight text-forest sm:text-6xl">
              Helping children build character, creativity and confidence through
              storytelling and responsible AI
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/72">
              SAI is a UK-based education and social impact initiative developing
              after-school enrichment experiences for children. Our approach combines
              values-based learning, storytelling, creative expression and responsible AI
              awareness in a format designed for schools, families and communities.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={`mailto:${contactEmail}`}
                className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-white transition hover:bg-forest/90"
              >
                Partner with SAI
              </a>
              <a
                href="#contact"
                className="rounded-full border border-forest/15 px-6 py-3 text-sm font-medium text-forest transition hover:border-forest hover:bg-white"
              >
                Enquire about pilot opportunities
              </a>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-forest/10 bg-white p-8 shadow-card sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal">
              Why it matters
            </p>
            <p className="mt-5 text-lg leading-8 text-ink/72">
              Children are growing up in a changing digital world. They need strong values
              and future-facing confidence, with adults helping them engage thoughtfully
              rather than passively with new tools.
            </p>
            <div className="mt-8 space-y-4 border-t border-forest/10 pt-6">
              <p className="text-sm uppercase tracking-[0.2em] text-ink/55">Built for</p>
              <p className="text-base leading-7 text-ink/72">
                Funding authorities, grant partners, schools, parents and community
                organisations looking for a calm, credible and responsible model.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <SectionHeading
            eyebrow="What we do"
            title="A values-led enrichment model built around story, reflection and guided creativity."
            description="SAI is being developed to help children explore core values, discuss stories and choices, build confidence through creative expression and engage with AI-supported tools in an age-appropriate way."
          />
          <div className="grid gap-4">
            {enrichmentPoints.map((point) => (
              <div
                key={point}
                className="rounded-[1.5rem] border border-forest/10 bg-white px-6 py-5 shadow-card"
              >
                <p className="text-center text-base font-semibold leading-7 text-forest">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-forest/10 bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Why now"
              title="The future will involve AI and digital tools. Children should be prepared to engage with them thoughtfully and responsibly."
              description="SAI takes a calm view of this moment. The aim is not to add hype, but to help children build judgement, confidence and creative agency with strong adult guidance."
            />
          </div>
          <div className="rounded-[1.75rem] bg-mist p-8 shadow-card sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral">
              A clear principle
            </p>
            <p className="mt-5 font-serif text-3xl leading-tight text-forest">
              Children do the thinking. Technology supports creativity and reflection.
            </p>
            <p className="mt-5 text-base leading-8 text-ink/72">
              That principle shapes the programme concept, the safeguarding stance and the
              way SAI speaks to schools, families and funding partners.
            </p>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-28 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="About"
            title="A thoughtful idea built on the belief that children need both strong values and future-facing skills."
            description="SAI is a UK-based education and social impact initiative being developed to help children grow in character, creativity and confidence through storytelling and responsible AI."
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <article className="rounded-[1.75rem] border border-forest/10 bg-white p-8 shadow-card sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal">
                Intro
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-forest">
                What SAI is and why it exists
              </h2>
              <p className="mt-5 text-base leading-8 text-ink/72">
                SAI is being developed as a calm, credible response to a changing world. It
                starts from a simple belief: children should be supported to grow in character
                and creativity while also gaining confidence around the tools shaping their
                future.
              </p>
            </article>

            <article className="rounded-[1.75rem] border border-forest/10 bg-white p-8 shadow-card sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal">
                Founding idea
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-forest">
                Values and future-facing skills should grow together
              </h2>
              <p className="mt-5 text-base leading-8 text-ink/72">
                SAI does not see these as competing aims. Character, reflection, imagination
                and digital confidence all belong together when children are learning to
                navigate the world around them.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-forest/10 bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral">
              Why storytelling
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-forest">
              Stories help children explore values, identity and self-expression in human terms.
            </h2>
            <p className="mt-5 text-base leading-8 text-ink/72">
              Through storytelling, children can discuss choices, feelings and relationships
              before moving into creative work. It is a natural way to explore what matters
              and how values show up in everyday life.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {values.map((value) => (
              <div
                key={value}
                className="rounded-[1.25rem] border border-forest/10 bg-mist px-5 py-4 shadow-card"
              >
                <p className="text-base font-medium text-forest">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <article className="rounded-[1.75rem] bg-mist p-8 shadow-card sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral">
              Why responsible AI
            </p>
            <p className="mt-4 text-base leading-8 text-ink/72">
              SAI is interested in helping children engage with emerging technology in a way
              that is thoughtful, creative and grounded. The goal is not passive use, but
              guided exploration where children keep their own voice and judgement.
            </p>
          </article>

          <article className="rounded-[1.75rem] bg-mist p-8 shadow-card sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral">
              Inclusion and confidence
            </p>
            <p className="mt-4 text-base leading-8 text-ink/72">
              SAI has a strong interest in helping girls and underrepresented young people
              see themselves as creators and future leaders in technology, not simply users
              of tools built by others.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-forest/10 bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <article className="rounded-[1.75rem] border border-forest/10 bg-white p-8 shadow-card sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal">
              Mission
            </p>
            <p className="mt-4 font-serif text-3xl leading-tight text-forest">
              To help children build character, creativity and confidence through
              storytelling and responsible AI.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-forest/10 bg-white p-8 shadow-card sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal">
              Vision
            </p>
            <p className="mt-4 font-serif text-3xl leading-tight text-forest">
              A future where children, especially girls and underrepresented young people,
              can engage with emerging technology as thoughtful, ethical and confident
              creators.
            </p>
          </article>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Trust and principles"
            title="SAI is being built around credibility, care and child-centred design."
            description="Visitors should be able to see clearly that safeguarding and careful AI use are not side notes. They are central to the model."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {trustPrinciples.map((principle) => (
              <div
                key={principle}
                className="rounded-[1.5rem] border border-forest/10 bg-white px-5 py-6 text-center shadow-card"
              >
                <p className="text-sm font-semibold leading-6 text-forest">{principle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="safeguarding"
        className="scroll-mt-28 border-y border-forest/10 bg-white px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Safeguarding & Responsible AI"
            title="Safeguarding is central to the SAI model, not an afterthought."
            description="SAI is being developed with child wellbeing, age-appropriate practice and careful use of technology at its core."
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <article className="rounded-[1.75rem] border border-forest/10 bg-white p-8 shadow-card sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal">
                Safeguarding approach
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-forest">
                A safeguarding-first mindset from the beginning
              </h2>
              <ul className="mt-6 space-y-4 text-base leading-8 text-ink/72">
                <li>Child wellbeing remains central to activity design.</li>
                <li>Experiences are intended to be age-appropriate and clearly guided.</li>
                <li>Adult oversight, clear boundaries and safe practice matter throughout.</li>
                <li>Inclusive participation is part of responsible delivery.</li>
              </ul>
            </article>

            <article className="rounded-[1.75rem] bg-mist p-8 shadow-card sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral">
                A core principle
              </p>
              <p className="mt-4 font-serif text-3xl leading-tight text-forest">
                Technology is intended to support creativity and reflection, not replace
                children&apos;s thinking or voice.
              </p>
            </article>
          </div>

          <div className="mt-12 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal">
              Responsible AI approach
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-forest">
              Careful use, clear boundaries and critical thinking over passive use.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {responsibleAiPrinciples.map((principle) => (
              <article
                key={principle}
                className="rounded-[1.5rem] border border-forest/10 bg-white px-6 py-5 shadow-card"
              >
                <p className="text-center text-base font-semibold leading-7 text-forest">
                  {principle}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-[1.75rem] border border-forest/10 bg-white p-8 shadow-card sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal">
              Privacy and transparency
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-forest">
              Schools, families and partners should understand what tools are used, how they
              are used and why they are used.
            </h2>
            <p className="mt-5 max-w-4xl text-base leading-8 text-ink/72">
              SAI aims to keep communication clear and grounded. That includes careful tool
              choices, straightforward explanation, and an approach that avoids unnecessary
              personal data wherever possible.
            </p>
          </div>
        </div>
      </section>

    </>
  );
}
