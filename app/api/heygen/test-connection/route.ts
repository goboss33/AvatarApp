import { NextResponse } from "next/server";
import { testConnection } from "@/lib/heygen";

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
    }

    const result = await testConnection(apiKey);

    if (result.success) {
      return NextResponse.json({ success: true, warning: result.warning });
    } else {
      return NextResponse.json({ success: false, error: result.error || "Connection failed" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Test failed" }, { status: 500 });
  }
}
