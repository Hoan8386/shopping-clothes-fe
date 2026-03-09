import type { DefaultSession } from "next-auth";
import type { Role } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      role: Role;
      accessToken: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    accessToken: string;
  }
}
