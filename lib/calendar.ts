import { generatePlan } from "./agent/generate-plan";
import type { ChildProfile, WeeklyCheckin } from "./agent/types";

type CalendarInput = {
  token: string;
  profile: ChildProfile;
  cycle: number;
  checkin: WeeklyCheckin;
  siteUrl: string;
};

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dateStamp(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function utcStamp(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function upcomingMonday(): Date {
  const now = new Date();
  const result = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = result.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  result.setDate(result.getDate() + daysUntilMonday);
  return result;
}

function eventDate(monday: Date, offset: number, time: string): { start: string; end: string } {
  const date = new Date(monday);
  date.setDate(date.getDate() + offset);
  const [hour, minute] = time.split(":").map(Number);
  const start = `${dateStamp(date)}T${pad(hour || 0)}${pad(minute || 0)}00`;
  const endDate = new Date(date);
  endDate.setHours(hour || 0, (minute || 0) + 30, 0, 0);
  const end = `${dateStamp(endDate)}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
  return { start, end };
}

export function buildCalendar(input: CalendarInput): string {
  const plan = generatePlan(input.profile, input.checkin.feedback, input.cycle);
  const monday = upcomingMonday();
  const offsets = [0, 2, 5];
  const times = [
    input.profile.weekdayTime || "19:30",
    input.profile.weekdayTime || "19:30",
    input.profile.weekendTime || "10:00",
  ];
  const now = utcStamp(new Date());
  const events = plan.tasks.flatMap((task, index) => {
    const { start, end } = eventDate(monday, offsets[index], times[index]);
    const description = [
      task.detail,
      "",
      `建议时长：${task.minutes}分钟`,
      `为什么这样安排：${task.why}`,
      `家长可以这样说：${plan.parentScript}`,
    ].join("\n");
    return [
      "BEGIN:VEVENT",
      `UID:${input.token}-${input.cycle}-${task.id}@yaban`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeIcs(`芽伴｜${task.title}`)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `URL:${input.siteUrl}`,
      `SEQUENCE:${input.cycle}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT10M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcs(`今天陪孩子完成：${task.title}`)}`,
      "END:VALARM",
      "END:VEVENT",
    ];
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "PRODID:-//Yaban//Family Growth Calendar//ZH-CN",
    `X-WR-CALNAME:${escapeIcs(`芽伴｜${input.profile.name}成长计划`)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT4H",
    "X-PUBLISHED-TTL:PT4H",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
