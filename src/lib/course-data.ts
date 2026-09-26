// Seed data for the course catalogue: one JSON file per subject area in
// src/data/courses/, sourced from ANU Programs & Courses
// (programsandcourses.anu.edu.au/<year>/course/<CODE>). Course names, terms and
// requisite text are real; `groups` is our best structured reading of each
// "Requisite and Incompatibility" section — an AND of ORs, covering only the
// parts checkable against a list of completed course codes. Anything else the
// real page requires (unit counts, program restriction, alternative pathways,
// a permission code) lives in `note` and `requiresPermission`, since a
// completed-courses list alone can't verify it.

export interface CourseSeed {
  code: string;
  title: string;
  terms: string;
  requiresPermission: boolean;
  groups: string[][];
  note?: string;
}

export interface SubjectSeed {
  code: string;
  description: string;
  courses: CourseSeed[];
}

const files = import.meta.glob<SubjectSeed>("../data/courses/*.json", {
  eager: true,
  import: "default",
});

// The JSON is scraped, so fill in the fields a scraper tends to leave out when empty.
export const subjectSeeds: SubjectSeed[] = Object.values(files)
  .map((subject) => ({
    ...subject,
    courses: subject.courses.map((c) => ({
      ...c,
      terms: c.terms.replaceAll("/", ", "),
      requiresPermission: c.requiresPermission ?? false,
      groups: c.groups ?? [],
    })),
  }))
  .sort((a, b) => a.description.localeCompare(b.description));
export const courseSeeds: CourseSeed[] = subjectSeeds.flatMap((s) => s.courses);

// A course's level is the thousands digit in its code (COMP2100 -> 2000).
// Used only to keep the random transcript below plausible for a student at
// a given year, not to check anything real.
function courseLevel(code: string): number {
  const digit = code.match(/\d/)?.[0];
  return digit ? Number(digit) * 1000 : 0;
}

function groupsSatisfied(seed: CourseSeed, completed: ReadonlySet<string>): boolean {
  return seed.groups.every((group) => group.some((code) => completed.has(code)));
}

// A new user has no transcript. Rather than start everyone from a blank
// slate, offer a made-up but internally consistent one: a 1st/2nd/3rd year
// student whose completed courses actually satisfy each other's
// prerequisites, built the same way a real transcript would (nothing is
// completed before what it depends on), so the app's own eligibility rules
// immediately have something interesting to say about it. Permission-gated
// courses are never auto-granted — those are exactly the ones a code check
// can't verify, so a fabricated history shouldn't sidestep that.
const MAJOR = "COMP";

export function randomiseTranscript(): { code: string; passed: boolean }[] {
  const year = 1 + Math.floor(Math.random() * 3);
  const levelCap = year * 1000;
  const target = { 1: rand(3, 5), 2: rand(7, 10), 3: rand(12, 16) }[year] ?? 5;

  // The portal's programme is Advanced Computing: COMP is the major, and one
  // other discipline supplies electives, as a real flexible degree would.
  const minors = subjectSeeds.filter((s) => s.code !== MAJOR);
  const minor = minors[Math.floor(Math.random() * minors.length)]?.code;
  const pool = shuffle(
    courseSeeds.filter(
      (c) =>
        !c.requiresPermission &&
        courseLevel(c.code) <= levelCap &&
        (c.code.startsWith(MAJOR) || (minor !== undefined && c.code.startsWith(minor))),
    ),
  );

  const completedSet = new Set<string>();
  const order: string[] = [];
  while (completedSet.size < target) {
    const unlocked = pool.filter(
      (c) => !completedSet.has(c.code) && groupsSatisfied(c, completedSet),
    );
    if (unlocked.length === 0) break;
    const majorUnlocked = unlocked.filter((c) => c.code.startsWith(MAJOR));
    const from = majorUnlocked.length > 0 && Math.random() < 0.7 ? majorUnlocked : unlocked;
    const next = from[Math.floor(Math.random() * from.length)];
    completedSet.add(next.code);
    order.push(next.code);
  }

  // Flavour: sometimes one of the picks didn't go so well. Only fail a
  // course nothing else in the set actually needed, so the fabricated
  // history stays internally consistent.
  let failed: string | undefined;
  if (order.length >= 3 && Math.random() < 0.35) {
    const bySeed = new Map(courseSeeds.map((c) => [c.code, c]));
    failed = order.find((candidate) =>
      order
        .filter((other) => other !== candidate)
        .every((other) => {
          const seed = bySeed.get(other);
          if (!seed) return true;
          return seed.groups.every(
            (group) =>
              !group.includes(candidate) ||
              group.some((code) => code !== candidate && completedSet.has(code)),
          );
        }),
    );
  }

  return order.map((code) => ({ code, passed: code !== failed }));
}

function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
