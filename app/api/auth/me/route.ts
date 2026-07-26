import { NextResponse } from "next/server";
import { getParentSession } from "../../../../lib/auth";

export async function GET() {
  try {
    const parent = await getParentSession();
    return NextResponse.json({ parent });
  } catch {
    return NextResponse.json({ parent: null });
  }
}
