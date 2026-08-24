import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nombre: string;
      telefono: string;
    } & DefaultSession["user"];
  }

  interface User {
    nombre?: string | null;
    telefono?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    nombre: string;
    telefono: string;
  }
}
