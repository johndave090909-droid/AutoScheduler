
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ClassBlock {
  day: DayOfWeek;
  start: string; // "HH:mm" - start of blocked time
  end: string;   // "HH:mm" - end of blocked time
}

export interface Student {
  id: string;
  idNumber: string; // e.g. "2081500"
  name: string;
  password?: string;
  skill: string;
  departmentId: string;
  seniority: number; // 1-10
  unavailability: ClassBlock[]; // Mark as "Busy"
  maxHours: number;
  currentHours: number;
  scheduleFileUrl?: string; // Uploaded semester schedule image URL (base64)
  availabilityStatus?: 'draft' | 'submitted'; // Draft vs submitted state
}

export interface Department {
  id: string;
  name: string;
  positions: string[];
  color: string; // Tailwind class for background
}

export interface ShiftRequirement {
  id: string;
  day: DayOfWeek;
  startTime: string; // "HH:mm" format
  endTime: string;   // "HH:mm" format
  skill: string;
  departmentId: string;
  count: number;
  noRequirement?: boolean; // "No Shift Requirement" — worker has total flexibility
}

export interface PinnedAssignment {
  id: string; // `${studentId}-${day}`
  studentId: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface Assignment {
  shiftId: string;
  studentId: string | null;
  adjustedStart?: string;
  adjustedEnd?: string;
  pinned?: boolean; // Whether this is a manual lock
}

export interface ScheduleResult {
  assignments: Assignment[];
  unassignedCount: number;
  fairnessScore: number;
  validationErrors: string[]; // For Lead Exclusivity flags
}

export interface AuthState {
  user: Student | null;
  isAdmin: boolean;
}
