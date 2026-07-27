const WEDNESDAY = 3;
const UTC_NOON = 12;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getCurrentWednesdayUtcWindow(reference = new Date()) {
  const now = new Date(reference);
  if (Number.isNaN(now.getTime())) throw new Error("Invalid weekly window reference");

  const candidate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    UTC_NOON,
    0,
    0,
    0,
  ));
  const daysSinceWednesday = (candidate.getUTCDay() - WEDNESDAY + 7) % 7;
  candidate.setUTCDate(candidate.getUTCDate() - daysSinceWednesday);
  if (now.getTime() < candidate.getTime()) {
    candidate.setUTCDate(candidate.getUTCDate() - 7);
  }

  return {
    start: candidate,
    end: new Date(candidate.getTime() + WEEK_MS),
  };
}
