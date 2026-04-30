import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { generateId } from "./utils";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { db } = await import("./db");
        const { users } = await import("./schema");
        const { eq } = await import("drizzle-orm");

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (user.length === 0) {
          throw new Error("Email ou mot de passe incorrect");
        }

        const isValid = await compare(password, user[0].password);
        if (!isValid) {
          throw new Error("Email ou mot de passe incorrect");
        }

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET,
});

export async function getUserHeygenKey(userId: string): Promise<string | null> {
  const { db } = await import("./db");
  const { settings: settingsTable } = await import("./schema");
  const { eq } = await import("drizzle-orm");

  const result = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.userId, userId))
    .limit(1);

  return result[0]?.heygenApiKey ?? null;
}

export async function createUserSeed() {
  const bcrypt = await import("bcryptjs");
  const { db } = await import("./db");
  const { users, settings: settingsTable } = await import("./schema");

  const hashedPassword = await bcrypt.default.hash("admin123", 10);
  const userId = generateId();
  const now = new Date();

  try {
    await db.insert(users).values({
      id: userId,
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin",
      createdAt: now,
    });

    await db.insert(settingsTable).values({
      id: generateId(),
      userId,
      heygenApiKey: null,
      updatedAt: now,
    });
  } catch {
    // User already exists
  }
}
