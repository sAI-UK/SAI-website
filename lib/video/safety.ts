import type { SafetyCategory, SafetyOutcome, StructuredStory } from "./types";

type Rule = { category: SafetyCategory; pattern: RegExp; disclosure?: boolean };

const rules: Rule[] = [
  { category: "personal_information", pattern: /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i },
  { category: "personal_information", pattern: /(?:\+?44\s?\d{4}|0\d{4})[\s-]?\d{3}[\s-]?\d{3}\b/ },
  { category: "personal_information", pattern: /\b\d{1,4}\s+[a-z][a-z\s]{2,30}\s(?:street|st|road|rd|avenue|ave|lane|ln|close|drive|way|postcode)\b/i },
  { category: "personal_information", pattern: /(?:^|\s)@[a-z0-9_.]{2,30}\b/i },
  { category: "personal_information", pattern: /\b(?:my|our)\s+(?:school|address|phone number|mobile|instagram|tiktok|snapchat)\b/i },
  { category: "real_person", pattern: /\b(?:celebrity|famous person|prime minister|president|king charles|taylor swift|mrbeast|cristiano ronaldo|lionel messi|elon musk)\b/i },
  { category: "real_person", pattern: /\b(?:my|our)\s+(?:teacher|mum|mom|dad|sister|brother|friend|classmate)\b/i },
  { category: "real_person", pattern: /\b(?:make|recreate|show|copy|impersonate)\s+(?:a video of\s+)?(?:me|my friend|my teacher|a real child|this student)\b/i },
  { category: "sexual_content", pattern: /\b(?:sex|sexual|nude|naked|porn|groom(?:ing|ed)?|molest(?:ed|ation)?)\b/i, disclosure: true },
  { category: "graphic_violence", pattern: /\b(?:decapitat|dismember|gore|guts|blood everywhere|tortur|stab(?:bing|bed)?|shoot(?:ing|s)? someone|murder(?:ed|ing)?)\w*/i },
  { category: "self_harm", pattern: /\b(?:suicide|kill myself|hurt myself|self[- ]?harm|cut myself|don't want to live)\b/i, disclosure: true },
  { category: "sensitive_disclosure", pattern: /\b(?:someone hurts me|being abused|abuses me|unsafe at home|afraid to go home|threatened me)\b/i, disclosure: true },
  { category: "hate_or_harassment", pattern: /\b(?:racial slur|hate (?:all|every)|target (?:gay|black|muslim|jewish|disabled) people)\b/i },
  { category: "drugs_or_weapons", pattern: /\b(?:cocaine|heroin|meth|sell drugs|gun|rifle|bomb|knife attack|weapon to hurt)\b/i },
  { category: "bullying", pattern: /\b(?:bully|humiliat|embarrass|make fun of|beat up)\w*/i },
  { category: "policy_bypass", pattern: /\b(?:ignore|bypass|override|forget)\b.{0,40}\b(?:safety|rules|policy|instructions|filter)\b/i },
  { category: "policy_bypass", pattern: /\b(?:jailbreak|developer mode|system prompt|do anything now)\b/i },
  { category: "political_or_commercial_persuasion", pattern: /\b(?:convince children to vote|political advert for children|gambling|casino|betting|buy this product)\b/i },
];

const safeConflictPattern = /\b(?:argument|disagree|lost|storm|dragon|monster|battle|fight|scared|danger)\b/i;

export function evaluateStorySafety(story: StructuredStory): SafetyOutcome {
  const combined = Object.values(story).filter((value) => typeof value === "string").join(" ");
  const matches = rules.filter((rule) => rule.pattern.test(combined));
  if (/^[A-Z][a-z'’-]{1,30}\s+[A-Z][a-z'’-]{1,30}$/.test(story.mainCharacter)) {
    matches.push({ category: "personal_information", pattern: /$^/ });
  }
  const flaggedCategories = [...new Set(matches.map((rule) => rule.category))];
  const disclosure = matches.some((rule) => rule.disclosure);

  let childSafeMessage = "Your story plan is ready for a teacher to review.";
  if (disclosure) {
    childSafeMessage =
      "Please stop using this tool and speak to the adult supervising this activity now. This story will not be sent to the video service.";
  } else if (flaggedCategories.includes("personal_information")) {
    childSafeMessage =
      "Please remove names or private details such as contact information, addresses, school names and social-media handles, then check your idea again.";
  } else if (flaggedCategories.includes("real_person")) {
    childSafeMessage =
      "Please change the person into a fictional character. We do not create videos of real people, celebrities, family members, teachers or pupils.";
  } else if (flaggedCategories.length) {
    childSafeMessage =
      "We can’t create that version, but you can change it into a fictional adventure where everyone is treated respectfully and nobody is seriously hurt.";
  } else if (safeConflictPattern.test(combined)) {
    childSafeMessage =
      "This fictional story can continue, but your teacher should check that the conflict stays mild and suitable for the group.";
  }

  return {
    allowed: flaggedCategories.length === 0,
    needsTeacherReview: flaggedCategories.length === 0,
    childSafeMessage,
    flaggedCategories,
    sanitisedPreview: story,
  };
}
