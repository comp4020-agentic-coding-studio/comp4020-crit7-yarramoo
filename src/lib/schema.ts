import { sql } from "drizzle-orm";
import { int, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.
//
// Two families of table, deliberately kept apart: the course catalogue
// (`subjectAreas`, `courses`, `prerequisiteGroups`) is one fixed dataset shared by every
// visitor, sourced from real ANU Programs & Courses data (see
// src/lib/course-data.ts). The student data (`users`, `completedCourses`,
// `enrolments`) is one row set per logged-in user, so the same catalogue can
// be checked against a different transcript for every account created.

// A subject area is the four-letter prefix of a course code (COMP, PSYC), which
// is how ANU codes are built, so courses don't store it again.
export const subjectAreas = sqliteTable("subject_areas", {
  code: text().primaryKey(),
  description: text().notNull(),
});

// Course catalogue. `requiresPermission` covers gates a code check can't
// verify on its own (competitive entry, supervisor sign-off, a permission
// code from the School) — those courses are always shown blocked. `prereqNote`
// carries the part of the real requisite text that isn't a specific course
// code (unit counts, program restrictions) so the student still sees the
// full picture even where the app can't enforce it.
export const courses = sqliteTable("courses", {
  code: text().primaryKey(),
  title: text().notNull(),
  terms: text().notNull(),
  requiresPermission: int("requires_permission", { mode: "boolean" })
    .notNull()
    .default(false),
  prereqNote: text("prereq_note"),
});

// An AND-of-ORs: within one `group`, completing any one `requiredCode`
// satisfies it; a course is prerequisite-clear only once every group it has
// is satisfied.
export const prerequisiteGroups = sqliteTable(
  "prerequisite_groups",
  {
    id: int().primaryKey({ autoIncrement: true }),
    courseCode: text("course_code")
      .notNull()
      .references(() => courses.code),
    group: int().notNull(),
    requiredCode: text("required_code").notNull(),
  },
  (table) => [uniqueIndex("prerequisite_groups_unique").on(table.courseCode, table.group, table.requiredCode)],
);

// There's no real identity provider here — see src/lib/auth.ts for what
// "login" means in this prototype. `password` is stored in the clear on
// purpose: it's a made-up credential for a made-up account, never a real
// one, and the whole point of the three-strikes joke is that the app can
// read it back to you.
export const users = sqliteTable("users", {
  username: text().primaryKey(),
  password: text().notNull(),
  failedAttempts: int("failed_attempts").notNull().default(0),
});

// Stand-in for the part of a student's ANU transcript that matters here:
// which courses they've completed, and with what result. One row per
// (user, course) — `passed: false` still counts as "completed" for display,
// but never satisfies a prerequisite group.
export const completedCourses = sqliteTable(
  "completed_courses",
  {
    username: text()
      .notNull()
      .references(() => users.username),
    code: text()
      .notNull()
      .references(() => courses.code),
    passed: int({ mode: "boolean" }).notNull().default(true),
  },
  (table) => [primaryKey({ columns: [table.username, table.code] })],
);

export const enrolments = sqliteTable(
  "enrolments",
  {
    username: text()
      .notNull()
      .references(() => users.username),
    courseCode: text("course_code")
      .notNull()
      .references(() => courses.code),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [primaryKey({ columns: [table.username, table.courseCode] })],
);

export type SubjectArea = typeof subjectAreas.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type PrerequisiteGroup = typeof prerequisiteGroups.$inferSelect;
export type User = typeof users.$inferSelect;
export type CompletedCourse = typeof completedCourses.$inferSelect;
export type Enrolment = typeof enrolments.$inferSelect;
