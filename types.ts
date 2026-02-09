
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ClassBlock {
  day: DayOfWeek;
  start: string; // "HH:mm" - start of blocked time
  end: string;   // "HH:mm" - end of blocked time
}

export interface Student {
  id: string;
  name: string;
  password?: string;
  skill: string; 
  departmentId: string;
  seniority: number; // 1-10
  unavailability: ClassBlock[]; // Mark as "Busy"
  maxHours: number;
  currentHours: number;
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
}

export interface Assignment {
  shiftId: string;
  studentId: string | null; 
  adjustedStart?: string; 
  adjustedEnd?: string;
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
