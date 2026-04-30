import { auth, getUserHeygenKey } from "@/lib/auth";
import { db } from "@/lib/db";
import { generations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getVideoStatus } from "@/lib/heygen";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = await getUserHeygenKey(session.user.id);
  if (!apiKey) return NextResponse.json({ error: "HeyGen API key not configured" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("video_id");

  if (!videoId) {
    return NextResponse.json({ error: "video_id is required" }, { status: 400 });
  }

  try {
    const result = await getVideoStatus(apiKey, videoId);

    if (result.status === "completed" || result.status === "failed") {
      await db
        .update(generations)
        .set({
          status: result.status === "completed" ? "completed" : "failed",
          videoUrl: result.video_url || null,
          completedAt: new Date(),
        })
        .where(eq(generations.videoId, videoId));
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get video status" },
      { status: 500 }
    );
  }
}
