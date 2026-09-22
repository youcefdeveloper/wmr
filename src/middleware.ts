import { defineMiddleware } from "astro/middleware";
import { getSession } from "auth-astro/server";
import { canAccess, roleForEmail } from "@lib/server/access";

const redirect = (location: string) =>
  new Response(null, { status: 302, headers: { Location: location } });

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
  context.locals.role = role;

  if (!canAccess(role, pathname)) {
    return isSpec(pathname) ? notFound() : redirect("/dashboard");
  }

  const response = await next();

  if (isDashboard && response.status === 404) return redirect("/");

  return response;
});
