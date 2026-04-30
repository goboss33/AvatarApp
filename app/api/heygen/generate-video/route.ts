import { auth, getUserHeygenKey } from "@/lib/auth";
import { db } from "@/lib/db";
import { generations } from "@/lib/schema";
import { NextResponse } from "next/server";
import { generateVideo } from "@/lib/heygen";
import { generateId } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = await getUserHeygenKey(session.user.id);
  if (!apiKey) return NextResponse.json({ error: "HeyGen API key not configured" }, { status: 400 });

  try {
    const body = await request.json();
    const { avatarId, talkingPhotoId, audioAssetId } = body;

    if (!audioAssetId) {
      return NextResponse.json({ error: "audioAssetId is required" }, { status: 400 });
    }

    const result = await generateVideo(apiKey, {
      avatarId,
      talkingPhotoId,
      audioAssetId,
    });

    await db.insert(generations).values({
      id: generateId(),
      userId: session.user.id,
      mode: talkingPhotoId ? "upload" : "avatar",
      avatarId,
      audioAssetId,
      videoId: result.video_id,
      status: "processing",
      createdAt: new Date(),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generate video failed" },
      { status: 500 }
    );
  }
}
