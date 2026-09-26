// Seed data for the course catalogue. Sourced from ANU Programs & Courses
// (programsandcourses.anu.edu.au/course/<CODE>), fetched 2026-09-26. Course
// names, terms and requisite text are real; `groups` is our best structured
// reading of each "Requisite and Incompatibility" section — an AND of ORs,
// covering only the parts checkable against a list of completed course
// codes. Anything else the real page requires (unit counts, program
// restriction, supervisor sign-off, a permission code) lives in `note` and
// `requiresPermission` instead, since a completed-courses list alone can't
// verify it. COMP4801 (Honours Result) is a result placeholder, not an
// enrollable class, so it's excluded.

export interface CourseSeed {
  code: string;
  title: string;
  terms: string;
  requiresPermission: boolean;
  groups: string[][];
  note?: string;
}

export const courseSeeds: CourseSeed[] = [
  {
    code: "COMP1100",
    title: "Programming as Problem Solving",
    terms: "First Semester, Second Semester",
    requiresPermission: false,
    groups: [],
  },
  {
    code: "COMP1110",
    title: "Structured Programming",
    terms: "First Semester, Second Semester",
    requiresPermission: false,
    groups: [["COMP1100", "COMP1130", "COMP1730"]],
  },
  {
    code: "COMP1140",
    title: "Structured Programming (Advanced)",
    terms: "Second Semester",
    requiresPermission: false,
    groups: [["COMP1130"]],
  },
  {
    code: "COMP1600",
    title: "Foundations of Computing",
    terms: "Second Semester",
    requiresPermission: false,
    groups: [["COMP1100", "COMP1130"]],
    note: "Also requires 6 units of MATH courses.",
  },
  {
    code: "COMP1730",
    title: "Programming for Scientists",
    terms: "First Semester, Second Semester",
    requiresPermission: false,
    groups: [],
  },
  {
    code: "COMP2100",
    title: "Software Construction",
    terms: "First Semester, Second Semester",
    requiresPermission: false,
    groups: [["COMP1110", "COMP1140"]],
    note: "Also requires 6 units of 1000-level MATH (BSc/Adv Science students also need COMP1600).",
  },
  {
    code: "COMP2120",
    title: "Software Engineering",
    terms: "Second Semester",
    requiresPermission: false,
    groups: [["COMP2100"]],
    note: "Currently studying COMP2100 also counts.",
  },
  {
    code: "COMP2310",
    title: "Systems, Networks, and Concurrency",
    terms: "Second Semester",
    requiresPermission: false,
    groups: [
      ["COMP1110", "COMP1140"],
      ["COMP2300", "ENGN2219"],
    ],
  },
  {
    code: "COMP2400",
    title: "Relational Databases",
    terms: "First Semester, Second Semester",
    requiresPermission: false,
    groups: [["COMP1100", "COMP1130", "INFS1001", "COMP1730"]],
  },
  {
    code: "COMP3300",
    title: "Operating Systems Implementation",
    terms: "Second Semester",
    requiresPermission: false,
    groups: [["COMP2310"]],
  },
  {
    code: "COMP3320",
    title: "High Performance Scientific Computation",
    terms: "Second Semester",
    requiresPermission: false,
    groups: [
      ["COMP2100", "COMP2300", "ENGN2219"],
      ["COMP1600"],
    ],
    note: "Or 6 units of MATH courses (excluding MATH1003) in place of COMP1600.",
  },
  {
    code: "COMP3430",
    title: "Data Wrangling",
    terms: "Second Semester",
    requiresPermission: false,
    groups: [["COMP1100", "COMP1130", "COMP1730"], ["COMP1110", "COMP1140"], ["COMP2400"]],
  },
  {
    code: "COMP3500",
    title: "Computing Team Project",
    terms: "First Semester, Second Semester",
    requiresPermission: true,
    groups: [["COMP2100"], ["COMP2120"]],
    note: "Must be studying Software Engineering (Honours) or Bachelor of Computing, and secure project-group membership approved by the convener before the end of week 1.",
  },
  {
    code: "COMP3600",
    title: "Algorithms",
    terms: "Second Semester",
    requiresPermission: false,
    groups: [],
    note: "Requires 24 units of COMP-coded courses, plus 6 units of MATH or COMP1600.",
  },
  {
    code: "COMP3670",
    title: "Introduction to Machine Learning",
    terms: "Second Semester",
    requiresPermission: false,
    groups: [["COMP1110", "COMP1140"]],
  },
  {
    code: "COMP3704",
    title: "Network Security",
    terms: "Second Semester",
    requiresPermission: false,
    groups: [["COMP2700"], ["COMP3310", "ENGN3539"]],
  },
  {
    code: "COMP3770",
    title: "Computing Research Project (R&D)",
    terms: "First Semester, Second Semester",
    requiresPermission: true,
    groups: [["COMP2550"]],
    note: "Must be studying Bachelor of Advanced Computing (R&D), have found a project/supervisor, and completed the Student Project Registration Form.",
  },
  {
    code: "COMP4820",
    title: "Advanced Computing Internship",
    terms: "First Semester, Second Semester",
    requiresPermission: true,
    groups: [["COMP2100"]],
    note: "Must be studying Bachelor of Advanced Computing, completed 12 units of 3000-level COMP courses, and be accepted via competitive application/interview.",
  },
  {
    code: "COMP3900",
    title: "Human-Computer Interaction",
    terms: "Second Semester",
    requiresPermission: false,
    groups: [],
    note: "Requires 12 units of 2000-level COMP courses.",
  },
  {
    code: "COMP4620",
    title: "Advanced Topics in Artificial Intelligence",
    terms: "Second Semester",
    requiresPermission: true,
    groups: [],
    note: "Requires 12 units of 3000/4000-level COMP courses; topic-specific prerequisites are published separately.",
  },
  {
    code: "COMP4650",
    title: "Document Analysis",
    terms: "Second Semester",
    requiresPermission: false,
    groups: [["COMP1600", "COMP2100"]],
    note: "Also requires 12 units of 3000/4000-level COMP or INFS courses.",
  },
  {
    code: "COMP4691",
    title: "Optimisation",
    terms: "Not currently offered",
    requiresPermission: false,
    groups: [["COMP3620"], ["MATH1013", "MATH1115"]],
  },
  {
    code: "COMP4500",
    title: "Software Engineering Team Project",
    terms: "First Semester, Second Semester",
    requiresPermission: true,
    groups: [["COMP2120", "COMP3500"]],
    note: "Bachelor of Advanced Computing students also need 12 units of 3000/4000-level courses; Software Engineering (Honours) students need COMP3500 specifically. Also requires project-group membership approved by the convener.",
  },
  {
    code: "COMP4550",
    title: "Computing Research Project",
    terms: "First Semester, Second Semester",
    requiresPermission: true,
    groups: [["COMP2550", "COMP4450"]],
    note: "Requires a weighted average of 70% across your best 36 units (excluding 1000-level), a confirmed project/supervisor, and the Student Project Registration Form.",
  },
  {
    code: "COMP5920",
    title: "Exchange Program in Computer Science",
    terms: "First Semester, Second Semester",
    requiresPermission: true,
    groups: [],
    note: "Contact the School of Computing for a permission code.",
  },
  {
    code: "COMP4011",
    title: "Advanced Topics in Formal Methods and Programming Languages",
    terms: "Second Semester",
    requiresPermission: true,
    groups: [],
    note: "Requires 12 units of 3000/4000-level COMP courses; topic-specific prerequisites are published separately.",
  },
  {
    code: "COMP4045",
    title: "Advanced Topics in Computer Systems",
    terms: "First Semester",
    requiresPermission: true,
    groups: [],
    note: "Requires 12 units of 3000/4000-level COMP courses; topic-specific prerequisites are published separately.",
  },
  {
    code: "COMP3740",
    title: "Individual Project",
    terms: "First Semester, Second Semester",
    requiresPermission: true,
    groups: [],
    note: "Requires 72 units completed towards your degree (CoSM students must be in a CSCI-MAJ). Permission code via the Student Project Registration Form.",
  },
];

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
export function randomiseTranscript(): { code: string; passed: boolean }[] {
  const year = 1 + Math.floor(Math.random() * 3);
  const levelCap = year * 1000;
  const target = { 1: rand(3, 5), 2: rand(7, 10), 3: rand(12, 16) }[year] ?? 5;

  const pool = shuffle(
    courseSeeds.filter((c) => !c.requiresPermission && courseLevel(c.code) <= levelCap),
  );

  const completedSet = new Set<string>();
  const order: string[] = [];
  while (completedSet.size < target) {
    const unlocked = pool.filter(
      (c) => !completedSet.has(c.code) && groupsSatisfied(c, completedSet),
    );
    if (unlocked.length === 0) break;
    const next = unlocked[Math.floor(Math.random() * unlocked.length)];
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
