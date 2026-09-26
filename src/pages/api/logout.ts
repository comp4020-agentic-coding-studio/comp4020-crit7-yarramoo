import type { APIRoute } from "astro";
import { clearSession } from "../../lib/auth";

export const POST: APIRoute = ({ cookies, redirect }) => {
  clearSession(cookies);
  return redirect("/login/", 303);
};
