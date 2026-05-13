import { auth, getUserHeygenKey } from "@/lib/auth";
import { db } from "@/lib/db";
import { generations } from "@/lib/schema";
import { NextResponse } from "next/server";
import { generateVideoV3, generateVideoWithTalkingPhoto } from "@/lib/heygen";
import { generateId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = await getUserHeygenKey(session.user.id);
  if (!apiKey) return NextResponse.json({ error: "HeyGen API key not configured" }, { status: 400 });

  try {
    const body = await request.json();
    const { avatarId, talkingPhotoId, audioAssetId, engine } = body;

    if (!audioAssetId) {
      return NextResponse.json({ error: "audioAssetId is required" }, { status: 400 });
    }

    let result: { video_id: string };

    if (talkingPhotoId) {
      result = await generateVideoWithTalkingPhoto(apiKey, {
        talkingPhotoId,
        audioAssetId,
      });
    } else if (avatarId) {
      result = await generateVideoV3(apiKey, {
        avatarId,
        audioAssetId,
        engine: engine || "avatar_iv",
      });
    } else {
      return NextResponse.json({ error: "avatarId or talkingPhotoId is required" }, { status: 400 });
    }

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
