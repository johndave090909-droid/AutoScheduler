
import {
  collection, doc, getDocs, setDoc, deleteDoc, onSnapshot,
  writeBatch, Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { Student, ShiftRequirement, Department } from '../types';

// ─── Collection References ────────────────────────────────────────
const STUDENTS_COL = 'students';
const SHIFTS_COL = 'shifts';
const DEPARTMENTS_COL = 'departments';

// ─── Students ─────────────────────────────────────────────────────
export const subscribeStudents = (
  callback: (students: Student[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  return onSnapshot(collection(db, STUDENTS_COL), snapshot => {
    const students = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Student));
    callback(students);
  }, (err) => {
    console.error('Firestore students subscription error:', err);
    if (onError) onError(err);
  });
};

export const saveStudents = async (students: Student[]): Promise<void> => {
  const batch = writeBatch(db);
  // Get existing docs to handle deletions
  const existing = await getDocs(collection(db, STUDENTS_COL));
  existing.docs.forEach(d => batch.delete(d.ref));
  // Write all current students
  students.forEach(s => {
    batch.set(doc(db, STUDENTS_COL, s.id), s);
  });
  await batch.commit();
};

export const saveStudent = async (student: Student): Promise<void> => {
  await setDoc(doc(db, STUDENTS_COL, student.id), student);
};

export const deleteStudent = async (studentId: string): Promise<void> => {
  await deleteDoc(doc(db, STUDENTS_COL, studentId));
};

// ─── Shifts ───────────────────────────────────────────────────────
export const subscribeShifts = (
  callback: (shifts: ShiftRequirement[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  return onSnapshot(collection(db, SHIFTS_COL), snapshot => {
    const shifts = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ShiftRequirement));
    callback(shifts);
  }, (err) => {
    console.error('Firestore shifts subscription error:', err);
    if (onError) onError(err);
  });
};

export const saveShifts = async (shifts: ShiftRequirement[]): Promise<void> => {
  const batch = writeBatch(db);
  const existing = await getDocs(collection(db, SHIFTS_COL));
  existing.docs.forEach(d => batch.delete(d.ref));
  shifts.forEach(s => {
    batch.set(doc(db, SHIFTS_COL, s.id), s);
  });
  await batch.commit();
};

// ─── Departments ──────────────────────────────────────────────────
export const subscribeDepartments = (
  callback: (depts: Department[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  return onSnapshot(collection(db, DEPARTMENTS_COL), snapshot => {
    const depts = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Department));
    callback(depts);
  }, (err) => {
    console.error('Firestore departments subscription error:', err);
    if (onError) onError(err);
  });
};

export const saveDepartments = async (departments: Department[]): Promise<void> => {
  const batch = writeBatch(db);
  const existing = await getDocs(collection(db, DEPARTMENTS_COL));
  existing.docs.forEach(d => batch.delete(d.ref));
  departments.forEach(dept => {
    batch.set(doc(db, DEPARTMENTS_COL, dept.id), dept);
  });
  await batch.commit();
};

// ─── Seed defaults if collections are empty ───────────────────────
export const seedIfEmpty = async (
  defaultDepts: Department[],
  defaultShifts: ShiftRequirement[],
  defaultStudents?: Student[]
): Promise<void> => {
  const deptsSnap = await getDocs(collection(db, DEPARTMENTS_COL));
  if (deptsSnap.empty) {
    await saveDepartments(defaultDepts);
  }
  const shiftsSnap = await getDocs(collection(db, SHIFTS_COL));
  if (shiftsSnap.empty) {
    // Firestore batch limit is 500 — split if needed
    const batchSize = 450;
    for (let i = 0; i < defaultShifts.length; i += batchSize) {
      const chunk = defaultShifts.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach(s => {
        batch.set(doc(db, SHIFTS_COL, s.id), s);
      });
      await batch.commit();
    }
  }
  if (defaultStudents && defaultStudents.length > 0) {
    const studentsSnap = await getDocs(collection(db, STUDENTS_COL));
    if (studentsSnap.empty) {
      await saveStudents(defaultStudents);
    }
  }
};
