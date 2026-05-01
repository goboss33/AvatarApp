import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { settings as settingsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.userId, session.user.id))
    .limit(1);

  return NextResponse.json({ 
    apiKey: result[0]?.heygenApiKey || "",
    apiCostPerSecond: result[0]?.apiCostPerSecond || "0.05",
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { apiKey, apiCostPerSecond } = await request.json();
  const now = new Date();

  const existing = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.userId, session.user.id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(settingsTable)
      .set({ 
        heygenApiKey: apiKey !== undefined ? apiKey : existing[0].heygenApiKey,
        apiCostPerSecond: apiCostPerSecond !== undefined ? apiCostPerSecond.toString() : existing[0].apiCostPerSecond,
        updatedAt: now 
      })
      .where(eq(settingsTable.userId, session.user.id));
  } else {
    await db.insert(settingsTable).values({
      id: generateId(),
      userId: session.user.id,
      heygenApiKey: apiKey || "",
      apiCostPerSecond: apiCostPerSecond !== undefined ? apiCostPerSecond.toString() : "0.05",
      updatedAt: now,
    });
  }

  return NextResponse.json({ success: true });
}
