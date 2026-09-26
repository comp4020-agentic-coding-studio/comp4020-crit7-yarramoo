import type { APIRoute } from "astro";
import { getSessionUser } from "../../lib/auth";
import { enrol } from "../../lib/db";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const username = getSessionUser(cookies);
  if (!username) return redirect("/login/", 303);

  const form = await request.formData();
  const code = String(form.get("code") ?? "");
  if (code) enrol(username, code);
  return redirect("/enrolment/", 303);
};
