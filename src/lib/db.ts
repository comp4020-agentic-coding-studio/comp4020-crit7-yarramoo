import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { subjectSeeds } from "./course-data";
import { describeOption, evaluate, type EligibilityCourse, type Option, type Student } from "./eligibility";
import {
  completedCourses,
  type Course,
  courses,
  enrolments,
  incompatibilities,
  prerequisiteGroups,
  type SubjectArea,
  subjectAreas,
  unitClauses,
  type User,
  users,
} from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });

// Seed the shared course catalogue from src/data/courses/*.json at every boot,
// as an upsert that also rewrites each course's prerequisite groups, so a
// deploy with corrected course data takes effect on an existing volume.
// Student data (users, their transcripts) is never seeded; it only exists
// once someone logs in.
function seed() {
  db.transaction((tx) => {
    for (const subject of subjectSeeds) {
      tx.insert(subjectAreas)
        .values({ code: subject.code, description: subject.description })
        .onConflictDoUpdate({ target: subjectAreas.code, set: { description: subject.description } })
        .run();
      for (const c of subject.courses) {
        const row = {
          title: c.title,
          terms: c.terms,
          units: c.units,
          requiresPermission: c.requiresPermission,
          prereqNote: c.note ?? null,
          unchecked: c.unchecked ?? null,
        };
        tx.insert(courses)
          .values({ code: c.code, ...row })
          .onConflictDoUpdate({ target: courses.code, set: row })
          .run();

        tx.delete(prerequisiteGroups).where(eq(prerequisiteGroups.courseCode, c.code)).run();
        tx.delete(unitClauses).where(eq(unitClauses.courseCode, c.code)).run();
        tx.delete(incompatibilities).where(eq(incompatibilities.courseCode, c.code)).run();

        c.groups.forEach((group, groupIndex) => {
          // A group's specific-course options collapse to one row per code
          // (orEnrolled true if any option for that code asked for it); its
          // unit-count options each get their own unitClauses row.
          const codeOptions = new Map<string, boolean>();
          for (const option of group) {
            if (typeof option === "string") {
              if (!codeOptions.has(option)) codeOptions.set(option, false);
            } else if ("code" in option) {
              codeOptions.set(option.code, (codeOptions.get(option.code) ?? false) || Boolean(option.orEnrolled));
            } else {
              tx.insert(unitClauses)
                .values({
                  courseCode: c.code,
                  group: groupIndex,
                  minUnits: option.units,
                  subjects: option.subjects && option.subjects.length > 0 ? option.subjects.join(",") : null,
                  levels: option.levels && option.levels.length > 0 ? option.levels.join(",") : null,
                  exclude: option.exclude && option.exclude.length > 0 ? option.exclude.join(",") : null,
                })
                .run();
            }
          }
          for (const [requiredCode, orEnrolled] of codeOptions) {
            tx.insert(prerequisiteGroups)
              .values({ courseCode: c.code, group: groupIndex, requiredCode, orEnrolled })
              .run();
          }
        });

        for (const incompatibleCode of new Set(c.incompatible)) {
          tx.insert(incompatibilities).values({ courseCode: c.code, incompatibleCode }).run();
        }
      }
    }
  });
}

seed();

export type { Course, SubjectArea, User };

export function listSubjectAreas(): SubjectArea[] {
  return db.select().from(subjectAreas).orderBy(subjectAreas.description).all();
}

export function listCourses(): Course[] {
  return db.select().from(courses).orderBy(courses.code).all();
}

export function getUser(username: string): User | undefined {
  return db.select().from(users).where(eq(users.username, username)).get();
}

export function createUser(username: string, password: string): User {
  db.insert(users).values({ username, password }).run();
  return getUser(username)!;
}

export function incrementFailedAttempts(username: string): number {
  const user = getUser(username);
  if (!user) return 0;
  const attempts = user.failedAttempts + 1;
  db.update(users).set({ failedAttempts: attempts }).where(eq(users.username, username)).run();
  return attempts;
}

export function resetFailedAttempts(username: string): void {
  db.update(users).set({ failedAttempts: 0 }).where(eq(users.username, username)).run();
}

export function getCompletedMap(username: string): Map<string, boolean> {
  const rows = db.select().from(completedCourses).where(eq(completedCourses.username, username)).all();
  return new Map(rows.map((r) => [r.code, r.passed]));
}

// Replaces a user's whole transcript in one go — used by both the "make up
// a plausible history" onboarding step and the god-mode editor, which both
// think in terms of "here's the complete set", not incremental edits.
export function setCompletedCourses(
  username: string,
  entries: { code: string; passed: boolean }[],
): void {
  db.transaction((tx) => {
    tx.delete(completedCourses).where(eq(completedCourses.username, username)).run();
    for (const entry of entries) {
      tx.insert(completedCourses)
        .values({ username, code: entry.code, passed: entry.passed })
        .run();
    }
  });
}

// Replaces only one subject area's slice of a user's transcript, leaving every
// other subject's completed courses untouched — used by the god-mode editor
// once it shows one subject at a time, so saving PSYC doesn't wipe COMP.
// `entries` is expected to already be scoped to `subjectCode` (the editor only
// renders radios for that subject's courses); as a defensive measure, any
// entry outside the subject is ignored rather than trusted blindly.
export function setCompletedCoursesForSubject(
  username: string,
  subjectCode: string,
  entries: { code: string; passed: boolean }[],
): void {
  const subjectCodes = new Set(
    listCourses()
      .filter((c) => c.code.startsWith(subjectCode))
      .map((c) => c.code),
  );
  const scopedEntries = entries.filter((e) => subjectCodes.has(e.code));

  db.transaction((tx) => {
    tx.delete(completedCourses)
      .where(and(eq(completedCourses.username, username), like(completedCourses.code, `${subjectCode}%`)))
      .run();
    for (const entry of scopedEntries) {
      tx.insert(completedCourses)
        .values({ username, code: entry.code, passed: entry.passed })
        .run();
    }
  });
}

export function enrol(username: string, code: string): void {
  db.insert(enrolments).values({ username, courseCode: code }).onConflictDoNothing().run();
}

// A course is blocked if it requires permission (a transcript can't verify a
// permission code or competitive entry), if any of its groups is unmet, or if
// the student has PASSED a course it's incompatible with — otherwise, once a
// transcript places it as neither completed nor already enrolled, it's
// eligible. See eligibility.ts for what "a group is unmet" and "incompatible"
// mean in detail; this is just where that pure logic meets the DB rows.
export interface CatalogueEntry {
  code: string;
  title: string;
  terms: string;
  units: number;
  prereqNote: string | null;
  unchecked: string | null;
  requiresPermission: boolean;
  // One line of human-readable text per unmet group, e.g. "6 units of MATH
  // (you have 0) or COMP1600" — options within a group joined with " or ".
  unmetGroups: string[];
  incompatibleWith: string[];
  status: "passed" | "failed" | "enrolled" | "eligible" | "blocked";
}

export function getCatalogueForUser(username: string): CatalogueEntry[] {
  const allCourses = listCourses();
  const allGroups = db.select().from(prerequisiteGroups).all();
  const allUnitClauses = db.select().from(unitClauses).all();
  const allIncompatibilities = db.select().from(incompatibilities).all();
  const completed = getCompletedMap(username);
  const passedSet = new Set([...completed].filter(([, passed]) => passed).map(([code]) => code));
  const enrolledSet = new Set(
    db
      .select()
      .from(enrolments)
      .where(eq(enrolments.username, username))
      .all()
      .map((r) => r.courseCode),
  );

  const unitsByCode = new Map(allCourses.map((c) => [c.code, c.units]));
  const student: Student = {
    passed: passedSet,
    enrolled: enrolledSet,
    unitsOf: (code) => unitsByCode.get(code) ?? 6,
  };

  // A course's group N is the union of its prerequisiteGroups rows and
  // unitClauses rows sharing that group index.
  const groupsByCourse = new Map<string, Map<number, Option[]>>();
  const groupFor = (courseCode: string, group: number): Option[] => {
    if (!groupsByCourse.has(courseCode)) groupsByCourse.set(courseCode, new Map());
    const forCourse = groupsByCourse.get(courseCode)!;
    if (!forCourse.has(group)) forCourse.set(group, []);
    return forCourse.get(group)!;
  };
  for (const row of allGroups) {
    groupFor(row.courseCode, row.group).push(
      row.orEnrolled ? { code: row.requiredCode, orEnrolled: true } : row.requiredCode,
    );
  }
  for (const row of allUnitClauses) {
    groupFor(row.courseCode, row.group).push({
      units: row.minUnits,
      subjects: row.subjects ? row.subjects.split(",") : undefined,
      levels: row.levels ? row.levels.split(",").map(Number) : undefined,
      exclude: row.exclude ? row.exclude.split(",") : undefined,
    });
  }

  const incompatibleByCourse = new Map<string, string[]>();
  for (const row of allIncompatibilities) {
    if (!incompatibleByCourse.has(row.courseCode)) incompatibleByCourse.set(row.courseCode, []);
    incompatibleByCourse.get(row.courseCode)!.push(row.incompatibleCode);
  }

  return allCourses.map((course): CatalogueEntry => {
    const groups = [...(groupsByCourse.get(course.code)?.values() ?? [])];
    const eligibilityCourse: EligibilityCourse = {
      code: course.code,
      requiresPermission: course.requiresPermission,
      groups,
      incompatible: incompatibleByCourse.get(course.code) ?? [],
    };
    const result = evaluate(eligibilityCourse, student);

    let status: CatalogueEntry["status"];
    if (completed.has(course.code)) status = completed.get(course.code) ? "passed" : "failed";
    else if (enrolledSet.has(course.code)) status = "enrolled";
    else if (!result.clear) status = "blocked";
    else status = "eligible";

    return {
      code: course.code,
      title: course.title,
      terms: course.terms,
      units: course.units,
      prereqNote: course.prereqNote,
      unchecked: course.unchecked,
      requiresPermission: course.requiresPermission,
      unmetGroups: result.unmetGroups.map((group) =>
        group.map((option) => describeOption(option, student)).join(" or "),
      ),
      incompatibleWith: result.incompatibleWith,
      status,
    };
  });
}
