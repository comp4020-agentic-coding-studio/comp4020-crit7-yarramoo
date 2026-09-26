import type { APIRoute } from "astro";
import { login, setSessionUser } from "../../lib/auth";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!username) return redirect("/login/", 303);

  const result = login(username, password);
  switch (result.kind) {
    case "created":
      setSessionUser(cookies, result.username);
      return redirect("/welcome/", 303);
    case "ok":
      setSessionUser(cookies, result.username);
      return redirect("/", 303);
    case "wrong":
      return redirect(
        `/login/?error=wrong&attempts=${result.attempts}&username=${encodeURIComponent(username)}`,
        303,
      );
    case "revealed":
      return redirect(
        `/login/?error=revealed&password=${encodeURIComponent(result.password)}&username=${encodeURIComponent(username)}`,
        303,
      );
  }
};
