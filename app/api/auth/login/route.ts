import { NextResponse } from "next/server";
import { loginParent, normalizeUsername, validateCredentials } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = normalizeUsername(body.username ?? "");
    const password = body.password ?? "";
    const validation = validateCredentials(username, password);
    if (validation) return NextResponse.json({ error: validation }, { status: 400 });
    const parent = await loginParent(username, password);
    return NextResponse.json({ parent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败，请稍后再试";
    return NextResponse.json({ error: message }, { status: message.includes("不正确") ? 401 : 500 });
  }
}
