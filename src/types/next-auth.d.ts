import type { DefaultSession } from "next-auth";
import type { Role } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      accessToken: string;
      sdt?: string;
      avatar?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    accessToken: string;
    sdt?: string;
    avatar?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role: Role;
    accessToken: string;
    sdt?: string;
    avatar?: string;
  }
}
