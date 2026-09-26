import { describe, expect, it } from "vitest";
import { describeOption, evaluate, type EligibilityCourse, type Student } from "../src/lib/eligibility";

// Pure unit tests of the evaluator, with inline fixture courses — no
// dependency on src/data/courses/*.json, so these stay meaningful whatever
// the real catalogue data says.

function student(overrides: Partial<Student> = {}): Student {
  return {
    passed: new Set(),
    enrolled: new Set(),
    unitsOf: () => 6,
    ...overrides,
  };
}

describe("evaluate: unit clause with subjects + levels", () => {
  const course: EligibilityCourse = {
    code: "COMP3600",
    groups: [[{ units: 12, subjects: ["COMP"], levels: [2000, 3000] }]],
  };

  it("is unmet when too few matching units are passed", () => {
    const s = student({ passed: new Set(["COMP1100", "COMP2100"]) }); // COMP2100 is the only 2000/3000-level COMP
    const result = evaluate(course, s);
    expect(result.clear).toBe(false);
    expect(result.unmetGroups).toEqual(course.groups);
  });

  it("is met once enough matching units are passed", () => {
    const s = student({ passed: new Set(["COMP2100", "COMP2120"]) }); // both 2000-level COMP, 6 units each
    expect(evaluate(course, s).clear).toBe(true);
  });

  it("doesn't count courses outside the subject or level filter", () => {
    const s = student({ passed: new Set(["MATH1013", "COMP1100"]) }); // wrong subject / wrong level
    expect(evaluate(course, s).clear).toBe(false);
  });
});

describe("evaluate: unit clause with exclusion", () => {
  const course: EligibilityCourse = {
    code: "COMP1600",
    groups: [[{ units: 6, subjects: ["MATH"], exclude: ["MATH1003"] }]],
  };

  it("doesn't let an excluded course count towards the total", () => {
    const s = student({ passed: new Set(["MATH1003"]) });
    expect(evaluate(course, s).clear).toBe(false);
  });

  it("counts a non-excluded course in the same subject", () => {
    const s = student({ passed: new Set(["MATH1013"]) });
    expect(evaluate(course, s).clear).toBe(true);
  });
});

describe("evaluate: unit clause OR a specific course code", () => {
  const course: EligibilityCourse = {
    code: "COMP3600",
    groups: [[{ units: 6, subjects: ["MATH"] }, "COMP1600"]],
  };

  it("is satisfied via the course code even with zero matching units", () => {
    const s = student({ passed: new Set(["COMP1600"]) });
    expect(evaluate(course, s).clear).toBe(true);
  });

  it("is satisfied via the unit clause without the course code", () => {
    const s = student({ passed: new Set(["MATH1013"]) });
    expect(evaluate(course, s).clear).toBe(true);
  });

  it("is unmet when neither option holds", () => {
    const s = student({ passed: new Set(["COMP1100"]) });
    expect(evaluate(course, s).clear).toBe(false);
  });
});

describe("evaluate: orEnrolled", () => {
  const course: EligibilityCourse = {
    code: "STAT2014",
    groups: [[{ code: "STAT2013", orEnrolled: true }]],
  };

  it("is unmet with neither passed nor enrolled", () => {
    expect(evaluate(course, student()).clear).toBe(false);
  });

  it("is satisfied when passed", () => {
    const s = student({ passed: new Set(["STAT2013"]) });
    expect(evaluate(course, s).clear).toBe(true);
  });

  it("is satisfied when only currently enrolled", () => {
    const s = student({ enrolled: new Set(["STAT2013"]) });
    expect(evaluate(course, s).clear).toBe(true);
  });

  it("describes the option as an enrol-or-pass alternative", () => {
    expect(describeOption({ code: "STAT2013", orEnrolled: true }, student())).toBe(
      "STAT2013 (or enrol in it)",
    );
  });
});

describe("evaluate: incompatibility", () => {
  const course: EligibilityCourse = {
    code: "STAT2013",
    groups: [],
    incompatible: ["STAT2008"],
  };

  it("blocks when the incompatible course has been passed", () => {
    const s = student({ passed: new Set(["STAT2008"]) });
    const result = evaluate(course, s);
    expect(result.clear).toBe(false);
    expect(result.incompatibleWith).toEqual(["STAT2008"]);
  });

  it("doesn't block otherwise", () => {
    expect(evaluate(course, student()).clear).toBe(true);
  });
});

describe("evaluate: an unknown passed course counts as 6 units", () => {
  const course: EligibilityCourse = {
    code: "COMP3600",
    groups: [[{ units: 6 }]],
  };

  it("is satisfied by a single passed course the catalogue doesn't recognise", () => {
    // unitsOf falls back to 6 for any code it's asked about, mirroring the
    // documented default for a passed course missing from the catalogue.
    const s = student({ passed: new Set(["XXXX9999"]) });
    expect(evaluate(course, s).clear).toBe(true);
  });

  it("describeOption reports the running total", () => {
    const s = student({ passed: new Set(["XXXX9999"]) });
    expect(describeOption({ units: 6 }, s)).toBe("6 units (you have 6)");
  });
});

describe("evaluate: requiresPermission always blocks", () => {
  it("is never clear even with no groups", () => {
    const course: EligibilityCourse = { code: "COMP4560", requiresPermission: true, groups: [] };
    expect(evaluate(course, student()).clear).toBe(false);
  });
});

describe("describeOption text", () => {
  it("renders a bare course code", () => {
    expect(describeOption("COMP1600", student())).toBe("COMP1600");
  });

  it("renders a units-with-subjects-and-exclusion clause", () => {
    const option = { units: 6, subjects: ["MATH"], exclude: ["MATH1003"] };
    expect(describeOption(option, student())).toBe("6 units of MATH, excl. MATH1003 (you have 0)");
  });

  it("renders a units-with-level-and-subject clause", () => {
    const option = { units: 12, subjects: ["COMP"], levels: [2000] };
    const s = student({ passed: new Set(["COMP2100"]) });
    expect(describeOption(option, s)).toBe("12 units of 2000-level COMP (you have 6)");
  });

  it("renders a plain units clause", () => {
    const s = student({ passed: new Set(["COMP1100", "COMP1110"]) });
    expect(describeOption({ units: 72 }, s)).toBe("72 units (you have 12)");
  });
});
