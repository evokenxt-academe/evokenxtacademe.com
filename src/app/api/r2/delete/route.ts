import { NextRequest, NextResponse } from "next/server";
import { deleteR2Object } from "@/lib/r2/upload";

export async function DELETE(request: NextRequest) {
  try {
    const { key } = await request.json();
    if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });
    await deleteR2Object(key);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[r2/delete] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
