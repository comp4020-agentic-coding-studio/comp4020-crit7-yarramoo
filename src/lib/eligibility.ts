// The pure eligibility rules — no DB import, so both the server (db.ts,
// against a real transcript) and the fabricated-history generator
// (course-data.ts, against a candidate transcript) share exactly one
// definition of "eligible". See the crit brief for the format this reads:
// a course's requirements are `groups`, an AND of ORs, where each group's
// options are either a specific course code (optionally "or currently
// enrolled in it") or a unit-count clause (a minimum sum over the passed
// transcript, optionally filtered by subject prefix / level / exclusion).
// `incompatible` is a separate straight block: having PASSED any of those
// courses makes this one blocked outright, regardless of the groups.

export interface UnitOption {
  units: number;
  subjects?: string[];
  levels?: number[];
  exclude?: string[];
}

export interface CodeOption {
  code: string;
  orEnrolled?: boolean;
}

// A bare string is shorthand for "passed this specific course code".
export type Option = string | CodeOption | UnitOption;

export interface EligibilityCourse {
  code: string;
  requiresPermission?: boolean;
  groups: Option[][];
  incompatible?: string[];
}

export interface Student {
  passed: ReadonlySet<string>;
  enrolled: ReadonlySet<string>;
  unitsOf: (code: string) => number;
}

export interface EvaluationResult {
  clear: boolean;
  unmetGroups: Option[][];
  incompatibleWith: string[];
}

export function isUnitOption(option: Option): option is UnitOption {
  return typeof option === "object" && "units" in option;
}

export function isCodeOption(option: Option): option is CodeOption {
  return typeof option === "object" && "code" in option;
}

// A course's level is the thousands digit in its code (COMP2100 -> 2000).
export function courseLevel(code: string): number {
  const digit = code.match(/\d/)?.[0];
  return digit ? Number(digit) * 1000 : 0;
}

function matchesUnitOption(code: string, option: UnitOption): boolean {
  if (option.exclude?.includes(code)) return false;
  if (option.subjects && option.subjects.length > 0 && !option.subjects.some((s) => code.startsWith(s))) {
    return false;
  }
  if (option.levels && option.levels.length > 0 && !option.levels.includes(courseLevel(code))) {
    return false;
  }
  return true;
}

// Sum of units over the student's PASSED courses matching this option's
// filter. A passed course the catalogue doesn't recognise still counts, at
// the documented default of 6 units.
function unitsTowards(option: UnitOption, student: Student): number {
  let total = 0;
  for (const code of student.passed) {
    if (matchesUnitOption(code, option)) total += student.unitsOf(code);
  }
  return total;
}

export function isSatisfied(option: Option, student: Student): boolean {
  if (typeof option === "string") return student.passed.has(option);
  if (isUnitOption(option)) return unitsTowards(option, student) >= option.units;
  return student.passed.has(option.code) || (Boolean(option.orEnrolled) && student.enrolled.has(option.code));
}

export function evaluate(course: EligibilityCourse, student: Student): EvaluationResult {
  const unmetGroups = course.groups.filter((group) => !group.some((option) => isSatisfied(option, student)));
  const incompatibleWith = (course.incompatible ?? []).filter((code) => student.passed.has(code));
  const clear = !course.requiresPermission && unmetGroups.length === 0 && incompatibleWith.length === 0;
  return { clear, unmetGroups, incompatibleWith };
}

function levelLabel(levels: number[]): string {
  return levels.join("/");
}

// Short human text for one option, always including a live "(you have N)"
// count for unit clauses so the student sees how far short they are —
// whether or not the option is currently satisfied.
export function describeOption(option: Option, student: Student): string {
  if (typeof option === "string") return option;
  if (isCodeOption(option)) {
    return option.orEnrolled ? `${option.code} (or enrol in it)` : option.code;
  }

  const hasSubjects = Boolean(option.subjects && option.subjects.length > 0);
  const hasLevels = Boolean(option.levels && option.levels.length > 0);
  let qualifier = "";
  if (hasLevels && hasSubjects) {
    qualifier = ` of ${levelLabel(option.levels!)}-level ${option.subjects!.join("/")}`;
  } else if (hasSubjects) {
    qualifier = ` of ${option.subjects!.join("/")}`;
  } else if (hasLevels) {
    qualifier = ` of ${levelLabel(option.levels!)}-level courses`;
  }
  const exclusion =
    option.exclude && option.exclude.length > 0 ? `, excl. ${option.exclude.join(", ")}` : "";
  const have = unitsTowards(option, student);
  return `${option.units} units${qualifier}${exclusion} (you have ${have})`;
}
