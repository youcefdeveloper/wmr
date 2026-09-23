import { defineMiddleware } from "astro/middleware";
import { getSession } from "auth-astro/server";
import { canAccess, roleForEmail } from "@lib/server/access";

const redirect = (location: string) =>
  new Response(null, { status: 302, headers: { Location: location } });

// Auth.js names the session cookie by prefix; the `__Secure-` one only exists
// over https and browsers refuse to clear it without `Secure`.
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

/**
 * Sends the browser to the login page with its session cookie cleared. Used
 * when the session outlives its account: the token is still valid, so a plain
 * redirect to /auth/login would bounce back to /dashboard forever.
 */
const signOut = () => {
  const headers = new Headers({ Location: "/auth/login" });
  for (const name of SESSION_COOKIES) {
    const secure = name.startsWith("__Secure-") ? "; Secure" : "";
    headers.append(
      "Set-Cookie",
      `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
    );
  }
  return new Response(null, { status: 302, headers });
};

// The spec is fetched by Swagger UI rather than navigated to, so it answers
// 404 instead of redirecting when access is denied.
const isSpec = (pathname: string) => pathname.startsWith("/api-docs/openapi.json");
const notFound = () =>
  new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isDashboard = pathname.startsWith("/dashboard");
  const isApiDocs = pathname.startsWith("/api-docs");

  if (!isDashboard && !isApiDocs) return next();

  const session = await getSession(context.request);
  if (!session) return isSpec(pathname) ? notFound() : redirect("/auth/login");

  const role = await roleForEmail(session.user?.email);
  // No role means the account was deleted or deactivated while signed in,
  // including an admin that just deleted itself. The session ends here.
  if (!role) return isSpec(pathname) ? notFound() : signOut();
  context.locals.role = role;

  if (!canAccess(role, pathname)) {
    return isSpec(pathname) ? notFound() : redirect("/dashboard");
  }

  const response = await next();

  if (isDashboard && response.status === 404) return redirect("/");

  return response;
});
