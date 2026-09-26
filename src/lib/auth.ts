import type { AstroCookies } from "astro";
import { createUser, getUser, incrementFailedAttempts, resetFailedAttempts } from "./db";

// There's no real identity provider in this prototype — "login" is just a
// username you type. The first time a username shows up, whatever password
// came with it becomes the account's password (no separate sign-up step).
// After that, a wrong password is tracked per-account, and the third miss in
// a row has the app read the real password back to you — a small joke about
// how little this is actually protecting.
const THRESHOLD = 3;

export type LoginResult =
  | { kind: "created"; username: string }
  | { kind: "ok"; username: string }
  | { kind: "wrong"; attempts: number }
  | { kind: "revealed"; password: string };

export function login(username: string, password: string): LoginResult {
  const user = getUser(username);
  if (!user) {
    createUser(username, password);
    return { kind: "created", username };
  }
  if (user.password === password) {
    resetFailedAttempts(username);
    return { kind: "ok", username };
  }
  const attempts = incrementFailedAttempts(username);
  if (attempts >= THRESHOLD) {
    resetFailedAttempts(username);
    return { kind: "revealed", password: user.password };
  }
  return { kind: "wrong", attempts };
}

const COOKIE = "session_user";

export function getSessionUser(cookies: AstroCookies): string | undefined {
  return cookies.get(COOKIE)?.value || undefined;
}

export function setSessionUser(cookies: AstroCookies, username: string): void {
  cookies.set(COOKIE, username, { path: "/", httpOnly: true, sameSite: "lax" });
}

export function clearSession(cookies: AstroCookies): void {
  cookies.delete(COOKIE, { path: "/" });
}
