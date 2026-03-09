import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const json = await res.json();
          const { access_token, user } = json.data ?? {};
          if (!access_token || !user) return null;

          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            role: user.role as Role,
            accessToken: access_token as string,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role as Role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as Role;
      session.user.accessToken = token.accessToken as string;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },
});
