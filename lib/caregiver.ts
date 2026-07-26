export const CAREGIVER_ROLES = [
  "爸爸",
  "妈妈",
  "爷爷",
  "奶奶",
  "外公",
  "外婆",
  "其他照顾者",
] as const;

export type CaregiverRole = (typeof CAREGIVER_ROLES)[number];

export function isCaregiverRole(value: string): value is CaregiverRole {
  return CAREGIVER_ROLES.includes(value as CaregiverRole);
}
