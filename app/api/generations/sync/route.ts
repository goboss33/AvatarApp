import { auth, getUserHeygenKey } from "@/lib/auth";
import { db } from "@/lib/db";
import { generations } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getVideoStatus } from "@/lib/heygen";

export const dynamic = "force-dynamic";

/**
 * POST /api/generations/sync
 * Checks all "processing" generations for the current user against HeyGen
 * and updates their status + video_url in the DB.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = await getUserHeygenKey(session.user.id);
  if (!apiKey)
    return NextResponse.json({ error: "HeyGen API key not configured" }, { status: 400 });

  // Fetch all processing jobs for this user
  const pending = await db
    .select()
    .from(generations)
    .where(
      and(
        eq(generations.userId, session.user.id),
        inArray(generations.status, ["processing", "pending"])
      )
    );

  if (pending.length === 0) {
    return NextResponse.json({ updated: 0, stillProcessing: 0 });
  }

  let updated = 0;
  let stillProcessing = 0;

  await Promise.all(
    pending.map(async (gen) => {
      if (!gen.videoId) return;
      try {
        const result = await getVideoStatus(apiKey, gen.videoId);

        if (result.status === "completed" || result.status === "failed") {
          await db
            .update(generations)
            .set({
              status: result.status === "completed" ? "completed" : "failed",
              videoUrl: result.video_url || null,
              completedAt: new Date(),
            })
            .where(eq(generations.id, gen.id));
          updated++;
        } else {
          stillProcessing++;
        }
      } catch {
        // If HeyGen API fails for a single job, keep it as-is
      }
    })
  );

  return NextResponse.json({ updated, stillProcessing });
}
