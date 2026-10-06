export interface Member {
  userId: string;
  name: string;
  joinedAt: number;
}

export interface AvailabilityRecord {
  userId: string;
  dates: string[]; // ISO format "YYYY-MM-DD"
}

export interface RoomDetails {
  code: string;
  createdAt: number;
  members: Member[];
  availabilities: Record<string, string[]>; // userId -> dates array
}

export interface HeatmapCell {
  date: string; // "YYYY-MM-DD"
  availableCount: number;
  totalMembers: number;
  ratio: number; // availableCount / totalMembers
  availableUserIds: string[];
  unavailableUserIds: string[];
}
