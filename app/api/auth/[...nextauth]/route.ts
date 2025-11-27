import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos");
        }

        // Get tenant from request headers
        const headers = new Headers(req.headers);
        const tenantSubdomain = headers.get("x-tenant-subdomain");

        if (!tenantSubdomain) {
          throw new Error("No se pudo determinar el tenant");
        }

        // Find tenant by subdomain
        const tenant = await prisma.tenant.findUnique({
          where: { subdomain: tenantSubdomain },
        });

        if (!tenant) {
          throw new Error("Tenant no encontrado");
        }

        // Find user by email and tenant
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            tenantId: tenant.id,
          },
        });

        if (!user || !user.password) {
          throw new Error("Credenciales inválidas");
        }

        // Verify password
        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Credenciales inválidas");
        }

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenant_id: user.tenantId,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenant_id = user.tenant_id;
        token.role = user.role;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.tenant_id = token.tenant_id;
        session.user.role = token.role;
        session.user.email = token.email;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
