import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { registerOrGetUser } from "@/lib/userRegistration";

export const LOCAL_DEV_AUTH_SECRET =
  "del-fraudshield-ai-local-development-secret-please-change-in-production";

export const resolvedAuthSecret =
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "production" ? undefined : LOCAL_DEV_AUTH_SECRET);


function normalizeEmail(email?: string | null) {
  return (email || "").trim().toLowerCase();
}

function roleForEmail(email?: string | null): "user" | "admin" {
  const admins = (process.env.ADMIN_EMAILS || "admin@fraudshield.local")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(normalizeEmail(email)) ? "admin" : "user";
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    id: "local-del",
    name: "Akun Lokal",
    credentials: {
      name: { label: "Nama Pengguna", type: "text" },
      email: { label: "Email", type: "email" }
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase() || "";
      const name = credentials?.name?.trim() || "";

      if (!email.includes("@") || name.length < 3) return null;

      try {
        const user = await registerOrGetUser(name, email);
        return {
          id: user.email,
          name: user.name,
          email: user.email,
          role: user.role
        };
      } catch (error) {
        console.error("Local user registration failed", error);
        return null;
      }
    }
  })
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: resolvedAuthSecret,
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.role = user.role ?? roleForEmail(user.email);
      }
      if (!token.role) token.role = roleForEmail(typeof token.email === "string" ? token.email : undefined);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = typeof token.email === "string" ? token.email : undefined;
        session.user.name = typeof token.name === "string" ? token.name : undefined;
        session.user.role = token.role === "admin" ? "admin" : "user";
      }
      return session;
    }
  }
};
