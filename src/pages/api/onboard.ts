import type { APIRoute } from "astro";
import { getSessionUser } from "../../lib/auth";
import { randomiseTranscript } from "../../lib/course-data";
import { setCompletedCourses } from "../../lib/db";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const username = getSessionUser(cookies);
  if (!username) return redirect("/login/", 303);

  const form = await request.formData();
  if (form.get("action") === "random") {
    setCompletedCourses(username, randomiseTranscript());
  }
  return redirect("/", 303);
};
