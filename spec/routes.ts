// The routes the invariants run against. When you add a page, add its route
// here, or the invariants stop covering it.
//
// /welcome/ and /god-mode/ are deliberately left out: both require a logged-in
// session (they redirect to /login/ otherwise), and the invariants fetch each
// route cold, with no session to give them. / itself stays in the sweep by
// rendering a plain logged-out state rather than redirecting, so it's always
// a real 200 to check.
export const ROUTES = ["/", "/login/", "/readme/"];
