import { NextResponse } from "next/server";
import {
  normalizeUsername,
  registerParent,
  validateCredentials,
} from "../../../../lib/auth";
import { isCaregiverRole } from "../../../../lib/caregiver";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      caregiverRole?: string;
    };
    const username = normalizeUsername(body.username ?? "");
    const password = body.password ?? "";
    const validation = validateCredentials(username, password);
    if (validation) return NextResponse.json({ error: validation }, { status: 400 });
    if (!body.caregiverRole || !isCaregiverRole(body.caregiverRole)) {
      return NextResponse.json({ error: "请选择你与孩子的关系" }, { status: 400 });
    }
    const parent = await registerParent(username, password, body.caregiverRole);
    return NextResponse.json({ parent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "注册失败，请稍后再试";
    return NextResponse.json({ error: message }, { status: message.includes("已经注册") ? 409 : 500 });
  }
}
