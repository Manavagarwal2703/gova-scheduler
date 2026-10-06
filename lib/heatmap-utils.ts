import type { HeatmapCell, Member } from "../types/contract";

export function computeHeatmapCells(
  dates: string[],
  members: Member[],
  availabilities: Record<string, string[]>
): HeatmapCell[] {
  const memberIdSet = new Set(members.map((m) => m.userId));
  const totalMembers = members.length;

  return dates.map((date) => {
    const availableUserIds: string[] = [];
    const unavailableUserIds: string[] = [];

    for (const member of members) {
      const userDates = availabilities[member.userId] || [];
      if (userDates.includes(date)) {
        availableUserIds.push(member.userId);
      } else {
        unavailableUserIds.push(member.userId);
      }
    }

    // Also check any extra users in availabilities that might not be in members
    for (const [userId, userDates] of Object.entries(availabilities)) {
      if (!memberIdSet.has(userId) && userDates.includes(date)) {
        availableUserIds.push(userId);
      }
    }

    const availableCount = availableUserIds.length;
    const ratio = totalMembers > 0 ? availableCount / totalMembers : 0;

    return {
      date,
      availableCount,
      totalMembers,
      ratio,
      availableUserIds,
      unavailableUserIds,
    };
  });
}

export function getHeatmapOpacity(ratio: number): number {
  if (ratio <= 0) return 0;
  // Scale between 0.15 and 1.0 for visibility
  return Math.min(1, Math.max(0.15, Number(ratio.toFixed(2))));
}

export function isDateSelected(
  availabilities: Record<string, string[]>,
  userId: string,
  date: string
): boolean {
  const userDates = availabilities[userId];
  if (!userDates || !Array.isArray(userDates)) return false;
  return userDates.includes(date);
}
