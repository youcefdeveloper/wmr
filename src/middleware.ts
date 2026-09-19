import { defineMiddleware } from "astro/middleware";
import { getSession } from "auth-astro/server";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (pathname.startsWith("/dashboard")) {
    const session = await getSession(context.request);

    if (!session) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/auth/login" },
      });
    }

    const response = await next();

    if (response.status === 404) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });
    }

    return response;
  }

  return next();
});
