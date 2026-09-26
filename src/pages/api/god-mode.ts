import type { APIRoute } from "astro";
import { getSessionUser } from "../../lib/auth";
import { listCourses, listSubjectAreas, setCompletedCoursesForSubject } from "../../lib/db";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const username = getSessionUser(cookies);
  if (!username) return redirect("/login/", 303);

  const form = await request.formData();
  const requestedSubject = String(form.get("subject") ?? "").toUpperCase();
  const subject =
    listSubjectAreas().find((s) => s.code === requestedSubject)?.code ??
    listSubjectAreas()[0]?.code ??
    "";

  // The page only renders course_<CODE> radios for the one subject on
  // screen, so only that subject's rows are ever present in the submitted
  // form — replacing just that slice leaves every other subject's completed
  // courses untouched (see setCompletedCoursesForSubject).
  const entries = listCourses()
    .filter((course) => course.code.startsWith(subject))
    .flatMap((course) => {
      const value = form.get(`course_${course.code}`);
      if (value === "pass") return [{ code: course.code, passed: true }];
      if (value === "fail") return [{ code: course.code, passed: false }];
      return [];
    });
  setCompletedCoursesForSubject(username, subject, entries);
  return redirect(`/god-mode/?subject=${encodeURIComponent(subject)}`, 303);
};
