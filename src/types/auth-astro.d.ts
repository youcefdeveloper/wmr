import 'auth-astro';

declare module 'auth-astro' {
  interface SessionUser {
    id: string;
    email: string;
    name: string;
    image?: string;
    provider?: string;
    role: 'superadmin' | 'admin' | 'user';
  }
}
