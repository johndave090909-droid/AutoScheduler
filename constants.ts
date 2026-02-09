
import { DayOfWeek, Department, ShiftRequirement } from './types';

// The matrix specifically excludes Wednesday and Sunday
export const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'];

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};

export const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: 'dept-office',
    name: 'L Office',
    positions: ['Apprenticeship', 'Supply Chain', 'Accountant', 'Trainer', 'PM CDP'],
    color: 'bg-slate-50'
  },
  {
    id: 'dept-bakery',
    name: 'Bakery Lead Group',
    positions: ['Bakery Apprentice', 'Bakery Intern 1', 'Bakery Intern 2'],
    color: 'bg-amber-50'
  },
  {
    id: 'dept-pantry',
    name: 'Pantry Lead',
    positions: [
      'Pantry Prep 1', 'Pantry Prep 2', 'Pantry Prep 3', 'Pantry Prep 4',
      'Pantry Prep 5', 'Pantry Prep 6', 'Pantry Prep 7'
    ],
    color: 'bg-emerald-50'
  },
  {
    id: 'dept-early-morning',
    name: 'Early Morning Lead',
    positions: [
      'Student Early Morning 1', 'Student Early Morning 2', 'Student Early Morning 3',
      'Student Early Morning 4', 'Student Early Morning 5'
    ],
    color: 'bg-sky-50'
  },
  {
    id: 'dept-afternoon-bakery',
    name: 'Afternoon Lead Bakery',
    positions: ['Student Afternoon 1', 'Student Afternoon 2', 'Student Afternoon 3'],
    color: 'bg-orange-50'
  },
  {
    id: 'dept-night',
    name: 'Night Lead',
    positions: [
      'Student Night 1', 'Student Night 2', 'Student Night 3',
      'Student Night 4', 'Student Night 5'
    ],
    color: 'bg-indigo-50'
  },
  {
    id: 'dept-morning-student',
    name: 'Morning Student Lead',
    positions: [
      'Luau + Ribs Prep', 'Beef Prep', 'Veg Prep', 'Sauce Prep',
      'Luau Braiser', 'Rice Prep', 'Imu Student 1', 'Imu Student 2'
    ],
    color: 'bg-yellow-50'
  },
  {
    id: 'dept-afternoon',
    name: 'Afternoon Lead',
    positions: [
      'Sauces/Soups', 'Afternoon Braiser', 'Chicken Prep', 'Fryer 1', 'Fryer 2',
      'Afternoon Ovens/Wok', 'Afternoon Ovens/Pan Out', 'Kitchen Pass',
      'Night Prep', 'Night Oven 1', 'Night Oven 2',
      'Night Garnish 1', 'Night Garnish 2', 'Night Garnish 3',
      'Night Fryer 1', 'Night Fryer 2'
    ],
    color: 'bg-rose-50'
  },
  {
    id: 'dept-foh',
    name: 'FOH Lead',
    positions: [
      'Expo', 'Wok', 'Grill Station', 'Sashimi Station', 'Chicken Carver',
      'Carving 1', 'Carving 2', 'Kampachi Gateway',
      'Kampachi 1', 'Kampachi 2', 'Kampachi 3',
      'Imu Carver 1', 'Imu Carver 2', 'Imu Carver 3',
      'Poke Bar 1', 'Poke Bar 2'
    ],
    color: 'bg-teal-50'
  },
  {
    id: 'dept-prep',
    name: 'Prep Lead',
    positions: [
      'Prep Cook 1', 'Prep Cook 2', 'Prep Cook 3', 'Prep Cook 4',
      'Prep Cook 5', 'Prep Cook 6', 'Prep Cook 7', 'Prep Cook 8',
      'Prep Cook 9', 'Prep Cook 10', 'Prep Cook 11'
    ],
    color: 'bg-violet-50'
  }
];

// Generate default shift requirements for every position across all 5 working days
export const generateDefaultShifts = (departments: Department[]): ShiftRequirement[] => {
  const shifts: ShiftRequirement[] = [];
  departments.forEach(dept => {
    dept.positions.forEach(pos => {
      DAYS.forEach(day => {
        const safePos = pos.replace(/[^a-zA-Z0-9]+/g, '-');
        shifts.push({
          id: `SHIFT-${dept.id}-${day}-${safePos}`,
          day,
          startTime: '09:00',
          endTime: '13:00',
          skill: pos,
          departmentId: dept.id,
          count: 1
        });
      });
    });
  });
  return shifts;
};

export const PYTHON_CODE_TEMPLATE = `
import pandas as pd
import pulp
import json

def solve_culinary_schedule(worker_csv, shift_csv):
    # Optimized Staffing Matrix Engine
    # Categorizes by Dept and handles split-shift logic
    workers = pd.read_csv(worker_csv)
    shifts = pd.read_csv(shift_csv)

    prob = pulp.LpProblem("Categorized_Labor_Optimization", pulp.LpMaximize)
    # LP optimization logic for multi-block days...
`;
