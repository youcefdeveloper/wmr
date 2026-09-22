/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Dashboard role of the signed-in user, set by the middleware. */
    role?: import('./lib/server/db').Role | null
  }
}
