
import { Student, ShiftRequirement, Assignment, ScheduleResult, DayOfWeek } from '../types';
import { DAYS } from '../constants';

const timeToMins = (timeStr: string): number => {
  const [hrs, mins] = timeStr.split(':').map(Number);
  return hrs * 60 + mins;
};

const minsToTime = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const getValidOffset = (student: Student, day: DayOfWeek, sStart: number, sEnd: number): number | null => {
  const offsets = [0, -15, 15]; 
  for (const offset of offsets) {
    const adjStart = sStart + offset;
    const adjEnd = sEnd + offset;

    const hasCriticalConflict = student.unavailability.some(block => {
      if (block.day !== day) return false;
      const bStart = timeToMins(block.start);
      const bEnd = timeToMins(block.end);
      
      const overlapStart = Math.max(adjStart, bStart);
      const overlapEnd = Math.min(adjEnd, bEnd);
      const overlapMins = overlapEnd - overlapStart;

      return overlapMins > 0;
    });

    if (!hasCriticalConflict) return offset;
  }
  return null;
};

export const solveScheduleHeuristic = (students: Student[], shifts: ShiftRequirement[]): ScheduleResult => {
  const assignments: Assignment[] = [];
  const validationErrors: string[] = [];
  
  // 1. Role Exclusivity Check: One Lead per Department
  const deptLeads: Record<string, string[]> = {};
  students.forEach(s => {
    if (s.skill.toLowerCase().includes('lead')) {
      if (!deptLeads[s.departmentId]) deptLeads[s.departmentId] = [];
      deptLeads[s.departmentId].push(s.name);
    }
  });

  Object.entries(deptLeads).forEach(([deptId, names]) => {
    if (names.length > 1) {
      validationErrors.push(`Constraint Violation: Department ${deptId} has multiple Leads: ${names.join(', ')}`);
    }
  });

  const studentAssignments: Record<string, Set<DayOfWeek>> = {};
  students.forEach(s => studentAssignments[s.id] = new Set());

  // Group shifts by Role and Time
  const timeSkillGroups: Record<string, ShiftRequirement[]> = {};
  shifts.forEach(s => {
    const key = `${s.startTime}-${s.endTime}-${s.skill}-${s.departmentId}`;
    if (!timeSkillGroups[key]) timeSkillGroups[key] = [];
    timeSkillGroups[key].push(s);
  });

  const sortedGroupKeys = Object.keys(timeSkillGroups).sort((a, b) => {
    const isLeadA = a.toLowerCase().includes('lead');
    const isLeadB = b.toLowerCase().includes('lead');
    if (isLeadA !== isLeadB) return isLeadA ? -1 : 1;
    return a.localeCompare(b);
  });

  sortedGroupKeys.forEach(key => {
    const groupShifts = timeSkillGroups[key];
    const firstShift = groupShifts[0];
    const sStartMins = timeToMins(firstShift.startTime);
    const sEndMins = timeToMins(firstShift.endTime);
    const maxCount = Math.max(...groupShifts.map(s => s.count));

    for (let i = 0; i < maxCount; i++) {
      // Count how many days actually need filling in this iteration
      const daysNeedingFill = DAYS.filter(d => groupShifts.some(gs => gs.day === d && gs.count > i)).length;

      const candidates = students.filter(student => {
        if (student.departmentId !== firstShift.departmentId) return false;
        const isLeadShift = firstShift.skill.toLowerCase().includes('lead');
        const isLeadStudent = student.skill.toLowerCase().includes('lead');
        if (isLeadShift !== isLeadStudent) return false;
        if (studentAssignments[student.id].size > 0) return false;

        let possibleDaysCount = 0;
        DAYS.forEach(d => {
          const offset = getValidOffset(student, d, sStartMins, sEndMins);
          if (offset !== null) {
            const exists = groupShifts.some(gs => gs.day === d && gs.count > i);
            if (exists) possibleDaysCount++;
          }
        });

        // Continuity Rule: Must be able to work all days that need filling
        return possibleDaysCount === daysNeedingFill;
      });

      if (candidates.length > 0) {
        candidates.sort((a, b) => b.seniority - a.seniority);
        const selected = candidates[0];

        DAYS.forEach(d => {
          const shiftOnDay = groupShifts.find(gs => gs.day === d && gs.count > i);
          if (shiftOnDay) {
            const offset = getValidOffset(selected, d, sStartMins, sEndMins);
            if (offset !== null) {
              assignments.push({
                shiftId: `${shiftOnDay.id}_${i}`,
                studentId: selected.id,
                adjustedStart: minsToTime(sStartMins + offset),
                adjustedEnd: minsToTime(sEndMins + offset)
              });
              studentAssignments[selected.id].add(d);
            }
          }
        });
      }
    }
  });

  // Gaps
  shifts.forEach(s => {
    for (let i = 0; i < s.count; i++) {
      const exists = assignments.some(a => a.shiftId === `${s.id}_${i}`);
      if (!exists) {
        assignments.push({ shiftId: `${s.id}_${i}`, studentId: null });
      }
    }
  });

  return { 
    assignments, 
    unassignedCount: assignments.filter(a => !a.studentId).length, 
    fairnessScore: 100,
    validationErrors 
  };
};
