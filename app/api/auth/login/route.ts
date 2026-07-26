import { NextResponse } from "next/server";
import {
  loginParent,
  normalizeUsername,
  updateCaregiverRole,
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
    const parent = await loginParent(username, password);
    await updateCaregiverRole(parent.id, body.caregiverRole);
    return NextResponse.json({
      parent: { ...parent, caregiverRole: body.caregiverRole },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败，请稍后再试";
    return NextResponse.json({ error: message }, { status: message.includes("不正确") ? 401 : 500 });
  }
}
