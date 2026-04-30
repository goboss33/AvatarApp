import { auth, getUserHeygenKey } from "@/lib/auth";
import { NextResponse } from "next/server";
import { listAvatars } from "@/lib/heygen";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = await getUserHeygenKey(session.user.id);
  if (!apiKey) return NextResponse.json({ error: "HeyGen API key not configured" }, { status: 400 });

  try {
    const result = await listAvatars(apiKey);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list avatars" },
      { status: 500 }
    );
  }
}
