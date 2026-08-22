import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verificarBloqueio, registrarTentativa } from "@/lib/rateLimit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 365,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        accessCode: { label: "Código de acesso", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();

        const bloqueio = await verificarBloqueio(email);
        if (bloqueio.bloqueado) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          await registrarTentativa(email, false);
          return null;
        }
        if (user.status !== "APPROVED") return null;

        const senhaCorreta = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!senhaCorreta) {
          await registrarTentativa(email, false);
          return null;
        }

        await registrarTentativa(email, true);

        if (user.needsAccessCode) {
          const codigoFornecido = ((credentials.accessCode as string) || "").trim();
          if (!codigoFornecido) return null;

          const settings = await prisma.settings.findUnique({ where: { id: 1 } });
          if (!settings?.accessCode || codigoFornecido !== settings.accessCode) return null;

          await prisma.user.update({ where: { id: user.id }, data: { needsAccessCode: false } });
        }

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
});