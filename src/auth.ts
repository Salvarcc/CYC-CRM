import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        correo: { label: "Correo", type: "email" },
        contrasena: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const correo =
          typeof credentials?.correo === "string"
            ? credentials.correo.trim().toLowerCase()
            : "";
        const contrasena =
          typeof credentials?.contrasena === "string" ? credentials.contrasena : "";

        if (!correo || !contrasena) return null;

        const cliente = await prisma.cliente.findUnique({ where: { correo } });
        if (!cliente) return null;

        const esValida = await bcrypt.compare(contrasena, cliente.passwordHash);
        if (!esValida) return null;

        return {
          id: cliente.id,
          nombre: cliente.nombre,
          email: cliente.correo,
          telefono: cliente.telefono,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.nombre = user.nombre;
        token.telefono = user.telefono;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.nombre = token.nombre;
      session.user.telefono = token.telefono;
      return session;
    },
  },
});
