import { auth, getUserHeygenKey } from "@/lib/auth";
import { NextResponse } from "next/server";
import { uploadAudio } from "@/lib/heygen";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = await getUserHeygenKey(session.user.id);
  if (!apiKey) return NextResponse.json({ error: "HeyGen API key not configured" }, { status: 400 });

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    console.log("[HeyGen Upload] Uploading audio:", audioFile.name, audioFile.size, "bytes");
    const arrayBuffer = await audioFile.arrayBuffer();
    const result = await uploadAudio(apiKey, arrayBuffer, audioFile.name);
    console.log("[HeyGen Upload] Result:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[HeyGen Upload] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
