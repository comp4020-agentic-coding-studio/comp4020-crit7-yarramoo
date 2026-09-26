import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, inject, it } from "vitest";

// HTTP contract test for the extended eligibility checker, driven against
// the running app (spec/global-setup.ts boots the built server). It exercises
// COMP3600's real requisite — "24 units of COMP plus 6 units of MATH or
// COMP1600" — which used to be silently ignored (see src/lib/eligibility.ts):
// a first-year with one COMP course should NOT show eligible, and a student
// who has actually cleared both groups should.
const baseUrl = inject("baseUrl");

async function login(username: string): Promise<string> {
  const res = await fetch(new URL("/api/login", baseUrl), {
    method: "POST",
    redirect: "manual",
    headers: { Origin: baseUrl, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password: "pw" }),
  });
  const cookie = res.headers.get("set-cookie");
  if (!cookie) throw new Error(`/api/login didn't set a session cookie (status ${res.status})`);
  return cookie.split(";")[0]!;
}

// god-mode replaces one subject's slice of the transcript at a time —
// course_<CODE>=pass|fail for every course in that subject the caller wants
// to set; anything else in the subject is left/cleared to not-completed.
async function setTranscript(cookie: string, subject: string, passed: string[]): Promise<void> {
  const body = new URLSearchParams({ subject });
  for (const code of passed) body.set(`course_${code}`, "pass");
  const res = await fetch(new URL("/api/god-mode", baseUrl), {
    method: "POST",
    redirect: "manual",
    headers: {
      Origin: baseUrl,
      Cookie: cookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (res.status !== 303) {
    throw new Error(`/api/god-mode didn't redirect as expected (status ${res.status})`);
  }
}

interface RowInfo {
  status: string;
  text: string;
}

async function comp3600Row(cookie: string): Promise<RowInfo> {
  const res = await fetch(new URL("/enrolment/?subject=COMP", baseUrl), {
    headers: { Cookie: cookie },
  });
  expect(res.status).toBe(200);
  const dom = new JSDOM(await res.text());
  const rows = [...dom.window.document.querySelectorAll(".results-row")];
  const row = rows.find((r) => r.querySelector(".code")?.textContent === "COMP3600");
  if (!row) throw new Error("COMP3600 row not found in /enrolment/?subject=COMP");
  const statusClass = [...row.classList].find((c) => c.startsWith("results-row--") && c !== "results-row--muted");
  return {
    status: statusClass?.replace("results-row--", "") ?? "",
    text: row.querySelector(".elig-text")?.textContent ?? "",
  };
}

describe("COMP3600 eligibility (24 units of COMP plus 6 units of MATH or COMP1600)", () => {
  const username = `spec-elig-${Date.now()}`;
  let cookie: string;

  beforeAll(async () => {
    cookie = await login(username);
  });

  it("is NOT eligible for a first-year with only COMP1100 passed", async () => {
    await setTranscript(cookie, "COMP", ["COMP1100"]);
    const row = await comp3600Row(cookie);
    expect(row.status).toBe("blocked");
    expect(row.text).toMatch(/units of COMP/);
  });

  it("is eligible once 24+ units of COMP and COMP1600 are passed", async () => {
    await setTranscript(cookie, "COMP", ["COMP1100", "COMP1110", "COMP2100", "COMP2120", "COMP1600"]);
    const row = await comp3600Row(cookie);
    expect(row.status).toBe("eligible");
    expect(row.text).toBe("Eligible");
  });
});
