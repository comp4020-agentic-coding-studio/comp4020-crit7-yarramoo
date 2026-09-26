import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { courseSeeds } from "./course-data";
import {
  completedCourses,
  type Course,
  courses,
  enrolments,
  prerequisiteGroups,
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

// Seed the (shared) course catalogue from the real ANU data in
// course-data.ts. Runs at every boot; onConflictDoNothing makes it a no-op
// once the rows already exist, so it's safe alongside a migration on an
// existing volume. Student data (users, their transcripts) is never seeded
// here — it only exists once someone logs in.
function seed() {
  for (const c of courseSeeds) {
    db.insert(courses)
      .values({
        code: c.code,
        title: c.title,
        terms: c.terms,
        requiresPermission: c.requiresPermission,
        prereqNote: c.note,
      })
      .onConflictDoNothing()
      .run();
    c.groups.forEach((group, groupIndex) => {
      for (const requiredCode of group) {
        db.insert(prerequisiteGroups)
          .values({ courseCode: c.code, group: groupIndex, requiredCode })
          .onConflictDoNothing()
          .run();
      }
    });
  }
}

seed();

export type { Course, User };

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

export function enrol(username: string, code: string): void {
  db.insert(enrolments).values({ username, courseCode: code }).onConflictDoNothing().run();
}

// A course is prerequisite-clear once every one of its OR-groups has at
// least one *passed* match — a failed attempt doesn't satisfy a prerequisite,
// and an empty group list is vacuously clear. `requiresPermission` courses
// are always blocked regardless: a transcript can't verify a permission code
// or competitive entry.
export interface CatalogueEntry {
  code: string;
  title: string;
  terms: string;
  prereqNote: string | null;
  requiresPermission: boolean;
  groups: string[][];
  status: "passed" | "failed" | "enrolled" | "eligible" | "blocked";
}

export function getCatalogueForUser(username: string): CatalogueEntry[] {
  const allCourses = listCourses();
  const allGroups = db.select().from(prerequisiteGroups).all();
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

  const groupsByCourse = new Map<string, Map<number, string[]>>();
  for (const row of allGroups) {
    if (!groupsByCourse.has(row.courseCode)) groupsByCourse.set(row.courseCode, new Map());
    const forCourse = groupsByCourse.get(row.courseCode)!;
    if (!forCourse.has(row.group)) forCourse.set(row.group, []);
    forCourse.get(row.group)!.push(row.requiredCode);
  }

  return allCourses.map((course): CatalogueEntry => {
    const groups = [...(groupsByCourse.get(course.code)?.values() ?? [])];
    const prereqsClear = groups.every((group) => group.some((code) => passedSet.has(code)));

    let status: CatalogueEntry["status"];
    if (completed.has(course.code)) status = completed.get(course.code) ? "passed" : "failed";
    else if (enrolledSet.has(course.code)) status = "enrolled";
    else if (course.requiresPermission || !prereqsClear) status = "blocked";
    else status = "eligible";

    return {
      code: course.code,
      title: course.title,
      terms: course.terms,
      prereqNote: course.prereqNote,
      requiresPermission: course.requiresPermission,
      groups,
      status,
    };
  });
}
