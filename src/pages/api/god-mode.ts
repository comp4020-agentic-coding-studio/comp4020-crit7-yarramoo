import type { APIRoute } from "astro";
import { getSessionUser } from "../../lib/auth";
import { listCourses, setCompletedCourses } from "../../lib/db";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const username = getSessionUser(cookies);
  if (!username) return redirect("/login/", 303);

  const form = await request.formData();
  const entries = listCourses().flatMap((course) => {
    const value = form.get(`course_${course.code}`);
    if (value === "pass") return [{ code: course.code, passed: true }];
    if (value === "fail") return [{ code: course.code, passed: false }];
    return [];
  });
  setCompletedCourses(username, entries);
  return redirect("/god-mode/", 303);
};
