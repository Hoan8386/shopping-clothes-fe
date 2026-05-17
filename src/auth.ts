import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@/types";
import { authService } from "@/services/auth.service";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        accessToken: { label: "Access Token", type: "text" },
        user: { label: "User", type: "text" },
      },
      async authorize(credentials, _request) {
        void _request;
        const accessToken = credentials?.accessToken;
        const userJson = credentials?.user;

        if (accessToken && userJson) {
          try {
            const user = JSON.parse(userJson as string) as {
              id: number;
              email: string;
              name: string;
              sdt?: string | null;
              avatar?: string | null;
              role: Role;
            };

            return {
              id: String(user.id),
              email: user.email,
              name: user.name,
              sdt: user.sdt ?? undefined,
              avatar: user.avatar ?? undefined,
              role: user.role as Role,
              accessToken: accessToken as string,
            };
          } catch {
            return null;
          }
        }

        if (!credentials?.username || !credentials?.password) return null;
        try {
          const res = await authService.login({
            username: String(credentials.username),
            password: String(credentials.password),
          });

          const { access_token, user } = res ?? {};
          if (!access_token || !user) return null;

          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            sdt: user.sdt ?? undefined,
            avatar: user.avatar ?? undefined,
            role: user.role as Role,
            accessToken: access_token as string,
          };
        } catch (err) {
          const resp = (err as {
            response?: { data?: { message?: string | string[]; error?: string | string[] } };
          })?.response?.data;

          if (Array.isArray(resp?.message)) {
            throw new Error(resp.message.join("\n"));
          }
          if (typeof resp?.message === "string" && resp.message.trim()) {
            throw new Error(resp.message);
          }
          if (Array.isArray(resp?.error)) {
            throw new Error(resp.error.join("\n"));
          }
          if (typeof resp?.error === "string" && resp.error.trim()) {
            throw new Error(resp.error);
          }

          throw new Error("Đăng nhập thất bại");
        }
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.accessToken = user.accessToken;
        token.sdt = user.sdt as string | undefined;
        token.avatar = user.avatar as string | undefined;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.accessToken = token.accessToken as string;
      session.user.sdt = token.sdt as string | undefined;
      session.user.image = token.avatar as string | undefined;
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
