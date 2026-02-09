
import { DayOfWeek, Department, ShiftRequirement, Student } from './types';

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

// Helper to create a student entry
const stu = (name: string, idNumber: string, skill: string, departmentId: string): Student => ({
  id: `STU-${idNumber || name.replace(/[^a-zA-Z]/g, '')}`,
  idNumber,
  name,
  password: 'password123',
  skill,
  departmentId,
  seniority: 5,
  unavailability: [],
  maxHours: 40,
  currentHours: 0
});

export const DEFAULT_STUDENTS: Student[] = [
  // L Office
  stu('John Ugay', '2081500', 'Apprenticeship', 'dept-office'),
  stu('Bellinda Puspita', '2072718', 'Supply Chain', 'dept-office'),
  stu('Linda Daeli', '2081628', 'Accountant', 'dept-office'),
  stu('Karen Kristine Daniel', '2080895', 'Trainer', 'dept-office'),
  stu('Bilguun Chonzorigt', '2067407', 'PM CDP', 'dept-office'),
  // Bakery Lead Group
  stu('Hailey Bradford', '584710', 'Bakery Apprentice', 'dept-bakery'),
  stu('Mkenzie Dawn', '584730', 'Bakery Intern 1', 'dept-bakery'),
  stu('Keri Okeson', '584720', 'Bakery Intern 2', 'dept-bakery'),
  // Pantry Lead
  stu('Veimiti Tahiata', '2081147', 'Pantry Lead', 'dept-pantry'),
  stu('Beryl Hota', '2081267', 'Pantry Prep 1', 'dept-pantry'),
  stu('Mend-Amar Jargalsaikhan', '2080016', 'Pantry Prep 2', 'dept-pantry'),
  stu('Rizkiana Duffie', '2078727', 'Pantry Prep 3', 'dept-pantry'),
  stu('Claire Wang', '2081679', 'Pantry Prep 4', 'dept-pantry'),
  stu('Davy Chhay', '2084159', 'Pantry Prep 5', 'dept-pantry'),
  stu('Munguntul Tegmid', '2084545', 'Pantry Prep 6', 'dept-pantry'),
  stu('Macy Catmull', '2077855', 'Pantry Prep 7', 'dept-pantry'),
  // Early Morning Lead
  stu('Sitara Tauiliili-Moea\'i', '583110', 'Early Morning Lead', 'dept-early-morning'),
  stu('Ronal Baroi', '2085066', 'Student Early Morning 1', 'dept-early-morning'),
  stu('Vanessa Delfin', '2080408', 'Student Early Morning 2', 'dept-early-morning'),
  stu('Hadley Moore', '2083166', 'Student Early Morning 3', 'dept-early-morning'),
  stu('Debourha Sabio', '2081309', 'Student Early Morning 4', 'dept-early-morning'),
  stu('Amrutha Kota', '2085067', 'Student Early Morning 5', 'dept-early-morning'),
  // Afternoon Lead Bakery
  stu('Jhanine Favia', '2081559', 'Afternoon Lead Bakery', 'dept-afternoon-bakery'),
  stu('Tiffani Ariono', '2082679', 'Student Afternoon 1', 'dept-afternoon-bakery'),
  stu('John Olivete', '2081205', 'Student Afternoon 2', 'dept-afternoon-bakery'),
  stu('Belle Heni', '2082131', 'Student Afternoon 3', 'dept-afternoon-bakery'),
  // Night Lead
  stu('Grace Christensen', '2074968', 'Night Lead', 'dept-night'),
  stu('Selah Dagdag', '2081156', 'Student Night 1', 'dept-night'),
  stu('Alphea Podador', '2081090', 'Student Night 2', 'dept-night'),
  stu('Amartuvshin Mendsaikhan', '2081114', 'Student Night 3', 'dept-night'),
  stu('Neneka Hayashi', '2081247', 'Student Night 4', 'dept-night'),
  stu('Asenaca Dulaki', '2085077', 'Student Night 5', 'dept-night'),
  // Morning Student Lead
  stu('Kaboiti Aata', '2080280', 'Morning Student Lead', 'dept-morning-student'),
  stu('Edison Lase', '2072717', 'Luau + Ribs Prep', 'dept-morning-student'),
  stu('Batkhuleg Bayanmunkh', '2085037', 'Beef Prep', 'dept-morning-student'),
  stu('Marianne Kaye Panadera', '2084998', 'Veg Prep', 'dept-morning-student'),
  stu('Kirsten Erekson', '2084467', 'Sauce Prep', 'dept-morning-student'),
  stu('Jethro Villanueva', '2081094', 'Luau Braiser', 'dept-morning-student'),
  stu('Rosina Mafi', '2084644', 'Rice Prep', 'dept-morning-student'),
  stu('Nikotemo Tewaaki Teketia', '583510', 'Imu Student 1', 'dept-morning-student'),
  stu('Ammon Joseph Ramirez', '584750', 'Imu Student 2', 'dept-morning-student'),
  // Afternoon Lead
  stu('Helaman Gonzaga', '2082667', 'Afternoon Lead', 'dept-afternoon'),
  stu('Evelynne Aurelia', '2082033', 'Sauces/Soups', 'dept-afternoon'),
  stu('Dane Prado', '2081158', 'Afternoon Braiser', 'dept-afternoon'),
  stu('Jiya Prakash', '2084444', 'Chicken Prep', 'dept-afternoon'),
  stu('Jasrine Rubin', '2080996', 'Fryer 1', 'dept-afternoon'),
  stu('Temoearii', '', 'Fryer 2', 'dept-afternoon'),
  stu('Judith Weman', '2081143', 'Afternoon Ovens/Wok', 'dept-afternoon'),
  stu('Ka Hei Chiu', '2084734', 'Afternoon Ovens/Pan Out', 'dept-afternoon'),
  stu('Alexia Lagunilla', '2082753', 'Kitchen Pass', 'dept-afternoon'),
  stu('Bo Lee', '2083521', 'Night Prep', 'dept-afternoon'),
  stu('Sebastian Delemoe', '2079825', 'Night Oven 1', 'dept-afternoon'),
  stu('Baxster Jimmy', '2084728', 'Night Oven 2', 'dept-afternoon'),
  stu('Sehar Zia', '2081549', 'Night Garnish 1', 'dept-afternoon'),
  stu('Abbygail Saban', '2084130', 'Night Garnish 2', 'dept-afternoon'),
  stu('Araya Na Songkhla', '2085259', 'Night Garnish 3', 'dept-afternoon'),
  stu('Sumanth Meruga', '2082948', 'Night Fryer 1', 'dept-afternoon'),
  stu('Tuvshinjargal Ariunbold', '2084495', 'Night Fryer 2', 'dept-afternoon'),
  // FOH Lead
  stu('Muluga Sanerive', '2081458', 'FOH Lead', 'dept-foh'),
  stu('Jovy Laniton', '2083823', 'Expo', 'dept-foh'),
  stu('Neil Court', '2074174', 'Wok', 'dept-foh'),
  stu('Jason Reynolds', '2083984', 'Grill Station', 'dept-foh'),
  stu('Dieu Nguyen', '2082911', 'Sashimi Station', 'dept-foh'),
  stu('Misheel Erdenepurev', '2084619', 'Chicken Carver', 'dept-foh'),
  stu('Munguntsetseg Tumurbatar', '2082759', 'Carving 1', 'dept-foh'),
  stu('Billery Ian Martin', '2051155', 'Carving 2', 'dept-foh'),
  stu('Channa Hem', '2079470', 'Kampachi Gateway', 'dept-foh'),
  stu('Ma. Mayeen Almario', '2080968', 'Kampachi 1', 'dept-foh'),
  stu('Ruth Devi', '2080021', 'Kampachi 2', 'dept-foh'),
  stu('Valeria Lozada', '2078478', 'Kampachi 3', 'dept-foh'),
  stu('James William', '2084507', 'Imu Carver 1', 'dept-foh'),
  stu('Inbeom Park', '2084399', 'Imu Carver 2', 'dept-foh'),
  stu('Pablo Robles', '2080412', 'Imu Carver 3', 'dept-foh'),
  stu('Radella Pramudita', '2084451', 'Poke Bar 1', 'dept-foh'),
  stu('Stefanie Kirifi', '2084136', 'Poke Bar 2', 'dept-foh'),
  // Prep Lead
  stu('Katriel Lamoglia', '2081106', 'Prep Lead', 'dept-prep'),
  stu('Telmen Gansukh', '584450', 'Prep Cook 1', 'dept-prep'),
  stu('Anne Alyssa Anak Gaadong', '2085047', 'Prep Cook 2', 'dept-prep'),
  stu('Zeph Kentaro Hatada', '2085055', 'Prep Cook 3', 'dept-prep'),
  stu('Elizabeth Veronica Benaia', '2085200', 'Prep Cook 4', 'dept-prep'),
  stu('Emily Teasley', '2084705', 'Prep Cook 5', 'dept-prep'),
  stu('Valery Adman', '2084993', 'Prep Cook 6', 'dept-prep'),
  stu('Aria Mahendra Wirastyo', '2085171', 'Prep Cook 7', 'dept-prep'),
  stu('Layla Taufoou', '2084980', 'Prep Cook 8', 'dept-prep'),
  stu('Ray Gaadong', '2084990', 'Prep Cook 9', 'dept-prep'),
  stu('Andy Dirgantara Wiradi', '2085009', 'Prep Cook 10', 'dept-prep'),
  stu('Ayden Nicholas', '2077447', 'Prep Cook 11', 'dept-prep'),
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
