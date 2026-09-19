 import GitHub from '@auth/core/providers/github';
import Google from '@auth/core/providers/google';
import LinkedIn from '@auth/core/providers/linkedin';
import MicrosoftEntraID from '@auth/core/providers/microsoft-entra-id';
import Apple from '@auth/core/providers/apple';
import { defineConfig } from 'auth-astro';
import { findAuthUserByEmail, listAllowedEmails } from './src/lib/server/admins';

export default defineConfig({
  providers: [
    Google({
      clientId: import.meta.env.GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: import.meta.env.GITHUB_CLIENT_ID,
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    LinkedIn({
      clientId: import.meta.env.LINKEDIN_CLIENT_ID,
      clientSecret: import.meta.env.LINKEDIN_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    MicrosoftEntraID({
      clientId: import.meta.env.MICROSOFT_CLIENT_ID,
      clientSecret: import.meta.env.MICROSOFT_CLIENT_SECRET,
      issuer: "https://login.microsoftonline.com/common/v2.0",
      authorization: {
        params: {
          scope: "openid profile email User.Read"
        }
      },
      profilePhotoSize: 120,
      allowDangerousEmailAccountLinking: true,
    }),
    Apple({
      clientId: import.meta.env.APPLE_CLIENT_ID,
      clientSecret: import.meta.env.APPLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          response_mode: "form_post",
        },
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {      
      const dashboardUrl = baseUrl + '/dashboard';
      
      // Always redirect to dashboard after login
      return dashboardUrl;
    },
    async signIn({ user, account }) {
      try {
        // Only active dashboard accounts may sign in, and only with one of
        // their allowed providers.
        const allowedEmails = (await listAllowedEmails()).map((email) =>
          email.trim().toLowerCase(),
        );

        const userEmail = (user.email ?? "").trim().toLowerCase();
        const provider = account?.provider;

        if (!allowedEmails.includes(userEmail)) return false;

        const dashboardUser = await findAuthUserByEmail(userEmail);
        return !!dashboardUser && dashboardUser.providers.some((p) => p === provider);
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      // Add additional data to the token when user signs in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image; // This is the avatar
      }

      // You can add provider-specific data from profile
      if (profile) {
        token.provider = account?.provider;
        // Add any additional profile data you want
        // For example, from Google: profile.given_name, profile.family_name, etc.
      }

      return token;
    },
    async session({ session, token }) {
      // Add data from token to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        // @ts-ignore - Adding custom property
        session.user.provider = token.provider as string;
      }
      return session;
    },
  }
})