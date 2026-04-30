import { auth, getUserHeygenKey } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createTalkingPhoto } from "@/lib/heygen";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = await getUserHeygenKey(session.user.id);
  if (!apiKey) return NextResponse.json({ error: "HeyGen API key not configured" }, { status: 400 });

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...bytes));
    const result = await createTalkingPhoto(apiKey, base64);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create talking photo failed" },
      { status: 500 }
    );
  }
}
