// Seed data for the course catalogue: one JSON file per subject area in
// src/data/courses/, sourced from ANU Programs & Courses
// (programsandcourses.anu.edu.au/<year>/course/<CODE>). Course names, terms and
// requisite text are real; `groups` is our best structured reading of each
// "Requisite and Incompatibility" section — an AND of ORs, where each option is
// either a specific course code or a unit-count clause (see eligibility.ts for
// the option shapes). `incompatible` is a straight block on courses already
// passed. Anything the app still can't verify (a program restriction, a
// convener's permission) lives in `unchecked`/`requiresPermission`; `note` is
// informational only.
//
// The JSON is scraped/hand-converted over time, so this loader accepts both
// the old shape (every course had `requiresPermission`/`groups`, `groups` was
// always `string[][]`) and the new one (every field below is optional, and a
// group's options can also be unit clauses or `{ code, orEnlisted }`) —
// normalising both into one `CourseSeed` shape.
import { type Option, type Student, courseLevel, evaluate, isSatisfied } from "./eligibility";

export interface CourseSeed {
  code: string;
  title: string;
  terms: string;
  units: number;
  requiresPermission: boolean;
  groups: Option[][];
  incompatible: string[];
  unchecked?: string;
  note?: string;
}

// The shape a JSON file may actually contain: every field but `code`/`title`/
// `terms` is optional, per the fixed data format.
interface RawCourseSeed {
  code: string;
  title: string;
  terms: string;
  units?: number;
  requiresPermission?: boolean;
  groups?: Option[][];
  incompatible?: string[];
  unchecked?: string;
  note?: string;
}

export interface SubjectSeed {
  code: string;
  description: string;
  courses: RawCourseSeed[];
}

const files = import.meta.glob<SubjectSeed>("../data/courses/*.json", {
  eager: true,
  import: "default",
});

// The JSON is scraped, so fill in the fields a scraper tends to leave out when empty.
export const subjectSeeds: { code: string; description: string; courses: CourseSeed[] }[] = Object.values(files)
  .map((subject) => ({
    ...subject,
    courses: subject.courses.map(
      (c): CourseSeed => ({
        ...c,
        terms: c.terms.replaceAll("/", ", "),
        units: c.units ?? 6,
        requiresPermission: c.requiresPermission ?? false,
        groups: c.groups ?? [],
        incompatible: c.incompatible ?? [],
      }),
    ),
  }))
  .sort((a, b) => a.description.localeCompare(b.description));
export const courseSeeds: CourseSeed[] = subjectSeeds.flatMap((s) => s.courses);

const unitsByCode = new Map(courseSeeds.map((c) => [c.code, c.units]));
function unitsOf(code: string): number {
  return unitsByCode.get(code) ?? 6;
}
const seedByCode = new Map(courseSeeds.map((c) => [c.code, c]));

function seedToEligibilityCourse(seed: CourseSeed) {
  return {
    code: seed.code,
    requiresPermission: seed.requiresPermission,
    groups: seed.groups,
    incompatible: seed.incompatible,
  };
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

  // A course is never picked alongside one it's incompatible with, checked
  // both ways round since the JSON only has to record the block on one side.
  const conflictsWithChosen = (seed: CourseSeed, completed: ReadonlySet<string>): boolean => {
    if (seed.incompatible.some((code) => completed.has(code))) return true;
    for (const code of completed) {
      if (seedByCode.get(code)?.incompatible.includes(seed.code)) return true;
    }
    return false;
  };

  const completedSet = new Set<string>();
  const order: string[] = [];
  while (completedSet.size < target) {
    const student: Student = { passed: completedSet, enrolled: new Set(), unitsOf };
    const unlocked = pool.filter(
      (c) =>
        !completedSet.has(c.code) &&
        evaluate(seedToEligibilityCourse(c), student).clear &&
        !conflictsWithChosen(c, completedSet),
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
    failed = order.find((candidate) => {
      const withoutCandidate = new Set(completedSet);
      withoutCandidate.delete(candidate);
      const student: Student = { passed: withoutCandidate, enrolled: new Set(), unitsOf };
      return order
        .filter((other) => other !== candidate)
        .every((other) => {
          const seed = seedByCode.get(other);
          if (!seed) return true;
          return seed.groups.every((group) => group.some((option) => isSatisfied(option, student)));
        });
    });
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
