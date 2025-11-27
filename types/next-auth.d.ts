import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
import { UserRole } from "./index";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenant_id: string;
      role: UserRole;
      email: string;
      name: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    tenant_id: string;
    role: UserRole;
    email: string;
    name: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    tenant_id: string;
    role: UserRole;
    email: string;
  }
}
