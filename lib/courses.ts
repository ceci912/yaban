export type CourseSessionStatus = "scheduled" | "completed" | "skipped";

export type CourseSession = {
  id: string;
  date: string;
  status: CourseSessionStatus;
  consumedUnits: number;
  note: string;
};

export type Course = {
  id: string;
  childId: string;
  title: string;
  provider: string;
  totalUnits: number;
  unitsPerSession: number;
  startDate: string;
  weekdays: number[];
  classTime: string;
  sessions: CourseSession[];
};

export function courseProgress(course: Course) {
  const usedUnits = course.sessions.reduce((sum, session) => sum + session.consumedUnits, 0);
  return {
    usedUnits,
    remainingUnits: Math.max(0, course.totalUnits - usedUnits),
  };
}
