
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.carRentalUsers.findUnique({
            where: { email: credentials.email }
          });

          if (!user || !user?.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user?.firstname || ''} ${user?.lastname || ''}`.trim() || user.email,
            role: user?.role || 'user',
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días en segundos
    updateAge: 24 * 60 * 60, // Actualizar sesión cada 24 horas
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Si es un nuevo login, guardar los datos del usuario
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      
      // IMPORTANTE: Refrescar el rol desde la BD para evitar desincronización
      // Esto se ejecuta en cada request para mantener el rol actualizado
      if (token.sub) {
        try {
          const dbUser = await prisma.carRentalUsers.findUnique({
            where: { id: parseInt(token.sub) },
            select: { role: true }
          });
          
          if (dbUser) {
            token.role = dbUser.role || 'user';
          }
        } catch (error) {
          console.error('Error refreshing user role:', error);
          // En caso de error, mantener el rol existente
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as string) || 'user';
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
};
