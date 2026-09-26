import type { APIRoute } from "astro";
import { getSessionUser } from "../../lib/auth";
import { enrol } from "../../lib/db";

// After enrolling, send the student back to the class-search results they
// enrolled from — a hidden `return` field on the row's form carries the
// current path + query. Only ever honoured when it points back into
// /enrolment, so a crafted `return` value can't be used as an open redirect.
function safeReturnTo(value: FormDataEntryValue | null): string {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/enrolment") ? path : "/enrolment/";
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const username = getSessionUser(cookies);
  if (!username) return redirect("/login/", 303);

  const form = await request.formData();
  const code = String(form.get("code") ?? "");
  if (code) enrol(username, code);
  return redirect(safeReturnTo(form.get("return")), 303);
};
