import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (result.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ name: result[0].name, email: result[0].email });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, name, email, newPassword } = await request.json();

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isValid = await compare(currentPassword, user[0].password);
  if (!isValid) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });

  if (newPassword && newPassword.length < 6) {
    return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
  }

  const updates: Record<string, string | Date> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (newPassword) updates.password = await hash(newPassword, 10);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true });
  }

  await db.update(users).set(updates).where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
