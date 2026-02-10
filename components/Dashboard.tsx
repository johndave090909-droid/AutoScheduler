
import React, { useState, useEffect, useMemo } from 'react';
import { Student, ShiftRequirement, ScheduleResult, DayOfWeek, Department, ClassBlock } from '../types';
import { solveScheduleHeuristic } from '../services/schedulerService';
import { DAYS, DEFAULT_DEPARTMENTS, DEFAULT_STUDENTS, generateDefaultShifts } from '../constants';
import { subscribeShifts, saveShifts, subscribeDepartments, saveDepartments, seedIfEmpty } from '../services/firestoreService';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalSection, Field, BtnPrimary, BtnSecondary, BtnDanger, inputClass, selectClass } from './Modal';

interface DashboardProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
}

const format12h = (time24: string): string => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
};

// ─── Modal State Types ────────────────────────────────────────────
interface AddRoleModalState { open: boolean; deptId: string; }
interface ConfirmDeleteModalState { open: boolean; deptId: string; roleName: string; }
interface AddWorkerModalState { open: boolean; }
interface EditWorkerModalState { open: boolean; stuId: string; }
interface TerminateModalState { open: boolean; stuId: string; stuName: string; }
interface AddBusyBlockModalState { open: boolean; stuId: string; }

const Dashboard: React.FC<DashboardProps> = ({ students, onUpdateStudents }) => {
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [shifts, setShifts] = useState<ShiftRequirement[]>([]);
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'editor' | 'workers'>('matrix');

  // ── Modal States ──────────────────────────────────────────────
  const [addRoleModal, setAddRoleModal] = useState<AddRoleModalState>({ open: false, deptId: '' });
  const [addRoleName, setAddRoleName] = useState('');
  const [addRoleError, setAddRoleError] = useState('');

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<ConfirmDeleteModalState>({ open: false, deptId: '', roleName: '' });

  const [addWorkerModal, setAddWorkerModal] = useState<AddWorkerModalState>({ open: false });
  const [workerForm, setWorkerForm] = useState({ name: '', idNumber: '', deptId: '', skill: '' });
  const [workerFormError, setWorkerFormError] = useState('');

  const [editWorkerModal, setEditWorkerModal] = useState<EditWorkerModalState>({ open: false, stuId: '' });
  const [editWorkerForm, setEditWorkerForm] = useState({ idNumber: '', deptId: '', skill: '' });
  const [editWorkerFormError, setEditWorkerFormError] = useState('');

  const [terminateModal, setTerminateModal] = useState<TerminateModalState>({ open: false, stuId: '', stuName: '' });

  const [busyBlockModal, setBusyBlockModal] = useState<AddBusyBlockModalState>({ open: false, stuId: '' });
  const [busyBlockForm, setBusyBlockForm] = useState<{ day: DayOfWeek; start: string; end: string }>({ day: 'Monday', start: '09:00', end: '12:00' });
  const [busyBlockError, setBusyBlockError] = useState('');

  // ── Firestore: seed defaults then subscribe to real-time data ──
  useEffect(() => {
    let unsubDepts: (() => void) | null = null;
    let unsubShifts: (() => void) | null = null;
    let cancelled = false;

    const fallbackToDefaults = () => {
      if (cancelled) return;
      setDepartments(DEFAULT_DEPARTMENTS);
      setShifts(generateDefaultShifts(DEFAULT_DEPARTMENTS));
    };

    const startSubscriptions = () => {
      if (cancelled) return;
      unsubDepts = subscribeDepartments(
        (firestoreDepts) => {
          if (!cancelled) setDepartments(firestoreDepts.length > 0 ? firestoreDepts : DEFAULT_DEPARTMENTS);
        },
        () => fallbackToDefaults()
      );
      unsubShifts = subscribeShifts(
        (firestoreShifts) => {
          if (!cancelled) setShifts(firestoreShifts.length > 0 ? firestoreShifts : generateDefaultShifts(DEFAULT_DEPARTMENTS));
        },
        () => fallbackToDefaults()
      );
    };

    const defaultShifts = generateDefaultShifts(DEFAULT_DEPARTMENTS);
    seedIfEmpty(DEFAULT_DEPARTMENTS, defaultShifts, DEFAULT_STUDENTS)
      .then(() => startSubscriptions())
      .catch(() => {
        fallbackToDefaults();
      });

    return () => {
      cancelled = true;
      if (unsubDepts) unsubDepts();
      if (unsubShifts) unsubShifts();
    };
  }, []);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const res = solveScheduleHeuristic(students, shifts);
      setResult(res);
      setIsOptimizing(false);
    }, 1200);
  };

  // Helper: persist shifts & departments to Firestore after local state update
  const persistShifts = (next: ShiftRequirement[]) => { setShifts(next); saveShifts(next); };
  const persistDepartments = (next: Department[]) => { setDepartments(next); saveDepartments(next); };

  const handleShiftUpdate = (shiftId: string, field: keyof ShiftRequirement, value: any) => {
    const next = shifts.map(s => s.id === shiftId ? { ...s, [field]: value } : s);
    persistShifts(next);
  };

  // ── Add Role ──────────────────────────────────────────────────
  const openAddRoleModal = (deptId: string) => {
    setAddRoleName('');
    setAddRoleError('');
    setAddRoleModal({ open: true, deptId });
  };

  const submitAddRole = () => {
    const roleName = addRoleName.trim();
    if (!roleName) { setAddRoleError('Role name is required'); return; }
    const dept = departments.find(d => d.id === addRoleModal.deptId);
    if (dept?.positions.includes(roleName)) { setAddRoleError('This role already exists in the department'); return; }

    const newShifts: ShiftRequirement[] = DAYS.map(day => ({
      id: `SHIFT-${Date.now()}-${day}-${addRoleModal.deptId}-${roleName.replace(/\s/g, '-')}`,
      day,
      startTime: "09:00",
      endTime: "13:00",
      skill: roleName,
      departmentId: addRoleModal.deptId,
      count: 1
    }));

    persistShifts([...shifts, ...newShifts]);
    persistDepartments(departments.map(d => d.id === addRoleModal.deptId ? { ...d, positions: [...d.positions, roleName] } : d));
    setAddRoleModal({ open: false, deptId: '' });
  };

  // ── Delete Role ───────────────────────────────────────────────
  const openDeleteRoleModal = (deptId: string, roleName: string) => {
    setConfirmDeleteModal({ open: true, deptId, roleName });
  };

  const submitDeleteRole = () => {
    const { deptId, roleName } = confirmDeleteModal;
    persistShifts(shifts.filter(s => !(s.departmentId === deptId && s.skill === roleName)));
    persistDepartments(departments.map(d => d.id === deptId ? { ...d, positions: d.positions.filter(p => p !== roleName) } : d));
    setConfirmDeleteModal({ open: false, deptId: '', roleName: '' });
  };

  // ── Add Worker ────────────────────────────────────────────────
  const openAddWorkerModal = () => {
    setWorkerForm({ name: '', idNumber: '', deptId: departments[0]?.id || '', skill: '' });
    setWorkerFormError('');
    setAddWorkerModal({ open: true });
  };

  const selectedDeptPositions = useMemo(() => {
    const dept = departments.find(d => d.id === workerForm.deptId);
    return dept?.positions || [];
  }, [departments, workerForm.deptId]);

  const submitAddWorker = () => {
    if (!workerForm.name.trim()) { setWorkerFormError('Worker name is required'); return; }
    if (!workerForm.idNumber.trim()) { setWorkerFormError('ID number is required'); return; }
    if (students.some(s => s.idNumber === workerForm.idNumber.trim())) { setWorkerFormError('This ID number is already in use'); return; }
    if (!workerForm.deptId) { setWorkerFormError('Please select a department'); return; }
    if (!workerForm.skill) { setWorkerFormError('Please select a role'); return; }

    const newStudent: Student = {
      id: `STU-${Date.now()}`,
      idNumber: workerForm.idNumber.trim(),
      name: workerForm.name.trim(),
      skill: workerForm.skill,
      departmentId: workerForm.deptId,
      seniority: 5,
      unavailability: [],
      maxHours: 40,
      currentHours: 0,
      password: 'password123'
    };
    onUpdateStudents([...students, newStudent]);
    setAddWorkerModal({ open: false });
  };

  // ── Edit Worker ─────────────────────────────────────────────
  const editDeptPositions = useMemo(() => {
    const dept = departments.find(d => d.id === editWorkerForm.deptId);
    return dept?.positions || [];
  }, [departments, editWorkerForm.deptId]);

  const openEditWorkerModal = (stu: Student) => {
    setEditWorkerForm({ idNumber: stu.idNumber, deptId: stu.departmentId, skill: stu.skill });
    setEditWorkerFormError('');
    setEditWorkerModal({ open: true, stuId: stu.id });
  };

  const submitEditWorker = () => {
    if (!editWorkerForm.idNumber.trim()) { setEditWorkerFormError('ID number is required'); return; }
    const duplicate = students.find(s => s.idNumber === editWorkerForm.idNumber.trim() && s.id !== editWorkerModal.stuId);
    if (duplicate) { setEditWorkerFormError('This ID number is already in use'); return; }
    if (!editWorkerForm.deptId) { setEditWorkerFormError('Please select a department'); return; }
    if (!editWorkerForm.skill) { setEditWorkerFormError('Please select a role'); return; }

    onUpdateStudents(students.map(s => s.id === editWorkerModal.stuId ? {
      ...s,
      idNumber: editWorkerForm.idNumber.trim(),
      departmentId: editWorkerForm.deptId,
      skill: editWorkerForm.skill
    } : s));
    setEditWorkerModal({ open: false, stuId: '' });
  };

  // ── Terminate Worker ────────────────────────────────────────
  const openTerminateModal = (stu: Student) => {
    setTerminateModal({ open: true, stuId: stu.id, stuName: stu.name });
  };

  const submitTerminate = () => {
    onUpdateStudents(students.filter(s => s.id !== terminateModal.stuId));
    setTerminateModal({ open: false, stuId: '', stuName: '' });
  };

  // ── Add Busy Block ────────────────────────────────────────────
  const openBusyBlockModal = (stuId: string) => {
    setBusyBlockForm({ day: 'Monday', start: '09:00', end: '12:00' });
    setBusyBlockError('');
    setBusyBlockModal({ open: true, stuId });
  };

  const submitBusyBlock = () => {
    if (busyBlockForm.start >= busyBlockForm.end) { setBusyBlockError('Start time must be before end time'); return; }
    const stu = students.find(s => s.id === busyBlockModal.stuId);
    if (!stu) return;
    const updated = [...stu.unavailability, { day: busyBlockForm.day, start: busyBlockForm.start, end: busyBlockForm.end }];
    onUpdateStudents(students.map(s => s.id === busyBlockModal.stuId ? { ...s, unavailability: updated } : s));
    setBusyBlockModal({ open: false, stuId: '' });
  };

  const updateWorkerUnavailability = (stuId: string, unavailability: ClassBlock[]) => {
    onUpdateStudents(students.map(s => s.id === stuId ? { ...s, unavailability } : s));
  };

  // ── Sort students: leads first within each department ──────
  const sortedStudentsByDept = useMemo(() => {
    const grouped: Record<string, Student[]> = {};
    departments.forEach(dept => { grouped[dept.id] = []; });
    students.forEach(stu => {
      if (grouped[stu.departmentId]) grouped[stu.departmentId].push(stu);
    });
    // Sort each group: leads first
    Object.keys(grouped).forEach(deptId => {
      grouped[deptId].sort((a, b) => {
        const aIsLead = a.skill.toLowerCase().includes('lead') || a.skill.toLowerCase().includes('apprenticeship') ? 1 : 0;
        const bIsLead = b.skill.toLowerCase().includes('lead') || b.skill.toLowerCase().includes('apprenticeship') ? 1 : 0;
        return bIsLead - aIsLead;
      });
    });
    return grouped;
  }, [students, departments]);

  const matrixData = useMemo(() => {
    if (!result) return null;
    const data: Record<string, Record<DayOfWeek, string[]>> = {};

    students.forEach(s => {
      data[s.id] = { 'Monday': [], 'Tuesday': [], 'Thursday': [], 'Friday': [], 'Saturday': [], 'Wednesday': [], 'Sunday': [] };
    });

    result.assignments.forEach(a => {
      if (!a.studentId) return;
      const shiftId = a.shiftId.split('_')[0];
      const shift = shifts.find(s => s.id === shiftId);
      if (shift) {
        const time = `${format12h(a.adjustedStart || shift.startTime)} - ${format12h(a.adjustedEnd || shift.endTime)}`;
        if (data[a.studentId]) {
          data[a.studentId][shift.day].push(time);
        }
      }
    });

    return data;
  }, [result, shifts, students]);

  // ── Availability link URL ────────────────────────────────────
  const availabilityLink = `${window.location.origin}${window.location.pathname}?availability=true`;

  return (
    <div className="max-w-[1800px] mx-auto px-4 py-8">
      {/* Constraints Alerts */}
      {result?.validationErrors && result.validationErrors.length > 0 && (
        <div className="mb-8 space-y-2">
          {result.validationErrors.map((err, idx) => (
            <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-red-500"></i>
              <p className="text-sm font-black text-red-800 uppercase tracking-tight">{err}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Labor Matrix Engine</h2>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Consistency-First Planning Engine</p>
        </div>
        <div className="flex gap-4">
           <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="bg-black text-white px-10 py-4 rounded-2xl font-black hover:bg-gray-800 transition-all shadow-2xl disabled:opacity-50 flex items-center gap-3"
          >
            {isOptimizing ? <i className="fas fa-cog fa-spin"></i> : <i className="fas fa-magic"></i>}
            Calculate Optimal Matrix
          </button>
        </div>
      </div>

      <div className="flex bg-gray-200/50 p-1.5 rounded-[2rem] mb-10 w-fit border border-gray-100 backdrop-blur-md">
        {[
          { id: 'matrix', label: 'Labor Matrix', icon: 'fa-table-cells' },
          { id: 'editor', label: 'Shift Requirements', icon: 'fa-list-check' },
          { id: 'workers', label: 'Workers Availability', icon: 'fa-users-gear' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-3.5 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-3 ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'matrix' && (
        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px] table-fixed">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="p-6 text-left font-black uppercase tracking-widest text-gray-400 w-64 border-r-2 border-gray-100 sticky left-0 bg-gray-50 z-20">Name</th>
                  <th className="p-6 text-left font-black uppercase tracking-widest text-gray-400 border-r-2 border-gray-100" style={{minWidth: '180px'}}>Role Anchor</th>
                  {DAYS.map(day => (
                    <th key={day} className="p-6 text-center font-black uppercase tracking-widest text-gray-400 border-r-2 border-gray-100">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-40 text-center">
                      <div className="flex flex-col items-center">
                        <i className="fas fa-users-slash text-5xl text-gray-200 mb-4"></i>
                        <p className="text-xl font-black text-gray-300">No Workers Defined</p>
                        <p className="text-sm text-gray-300 font-bold mt-2">Go to the "Workers Availability" tab to add staff.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  departments.map(dept => {
                    const deptStudents = sortedStudentsByDept[dept.id] || [];
                    if (deptStudents.length === 0) return null;
                    return (
                      <React.Fragment key={dept.id}>
                        <tr className={`${dept.color} border-b-2 border-gray-200/50`}>
                          <td colSpan={7} className="px-6 py-4 text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] sticky left-0 z-10 border-r-2 border-gray-200/50">
                            {dept.name} Division
                          </td>
                        </tr>
                        {deptStudents.map(stu => (
                          <tr key={stu.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                            <td className="p-6 font-black text-sm text-gray-800 border-r-2 border-gray-100 sticky left-0 bg-white z-10 group-hover:bg-gray-50 border-l-4 border-l-transparent group-hover:border-l-black transition-all">
                              {stu.name}
                            </td>
                            <td className="p-6 font-bold text-gray-500 border-r-2 border-gray-100">
                              <span className={`inline-block px-4 py-2 rounded-xl border whitespace-normal break-words ${stu.skill.toLowerCase().includes('lead') || stu.skill.toLowerCase().includes('apprenticeship') ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {stu.skill}
                              </span>
                            </td>
                            {DAYS.map(day => {
                              const shiftsOnDay = matrixData?.[stu.id]?.[day] || [];
                              return (
                                <td key={day} className="p-4 border-r-2 border-gray-100 text-center">
                                  {shiftsOnDay.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                      {shiftsOnDay.map((s, idx) => (
                                        <div key={idx} className="bg-white border-2 border-gray-100 rounded-2xl py-3 px-4 font-black text-gray-800 shadow-sm leading-none text-xs">
                                          {s}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-200 font-bold text-[9px] uppercase tracking-widest">---</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="space-y-12">
          {departments.map(dept => (
            <div key={dept.id} className="bg-white p-12 rounded-[3.5rem] border-4 border-gray-50 shadow-sm">
              <div className="flex items-center justify-between mb-12 border-b pb-8">
                <div className="flex items-center gap-6">
                  <div className={`w-20 h-20 rounded-[2rem] ${dept.color} flex items-center justify-center border-2 border-gray-100 text-3xl text-gray-800`}>
                     <i className="fas fa-layer-group"></i>
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{dept.name} Shift Roles</h3>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Daily Workforce Target</p>
                  </div>
                </div>
                <button
                  onClick={() => openAddRoleModal(dept.id)}
                  className="bg-black text-white px-8 py-3 rounded-2xl font-black hover:scale-105 transition-transform flex items-center gap-3"
                >
                  <i className="fas fa-plus"></i> Add New Shift Role
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-4 border-gray-100">
                      <th className="p-6 text-left text-[11px] font-black uppercase text-gray-400 w-64 border-r-2 border-gray-50">Shift Role</th>
                      {DAYS.map(day => <th key={day} className="p-6 text-center text-[11px] font-black uppercase text-gray-400 border-r-2 border-gray-50">{day}</th>)}
                      <th className="p-6 text-center text-[11px] font-black uppercase text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dept.positions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-xs italic">
                          No roles added to this department.
                        </td>
                      </tr>
                    ) : (
                      dept.positions.map(pos => (
                        <tr key={pos} className="border-b-2 border-gray-50 hover:bg-gray-50/20 transition-all group">
                          <td className="p-6 font-black text-lg text-gray-800 border-r-2 border-gray-50">{pos}</td>
                          {DAYS.map(day => {
                            const dayShifts = shifts.filter(s => s.day === day && s.departmentId === dept.id && s.skill === pos);
                            return (
                              <td key={day} className="p-4 border-r-2 border-gray-50">
                                {dayShifts.map(s => (
                                  <div key={s.id} className="bg-white p-5 rounded-[2rem] border-2 border-gray-100 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center text-[11px] font-black text-indigo-500 uppercase tracking-widest">
                                      <span>Requirement</span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-gray-300">QTY:</span>
                                        <input
                                          type="number" className="w-12 bg-gray-50 border-2 border-gray-100 rounded-xl p-1.5 text-center font-black focus:border-black outline-none"
                                          value={s.count} onChange={e => handleShiftUpdate(s.id, 'count', parseInt(e.target.value))}
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      <div className="relative">
                                        <span className="absolute left-3 top-1 text-[9px] font-black text-gray-300 uppercase">Clock In</span>
                                        <input type="time" className="w-full text-xs bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pt-6 font-black focus:border-black outline-none" value={s.startTime} onChange={e => handleShiftUpdate(s.id, 'startTime', e.target.value)} />
                                      </div>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1 text-[9px] font-black text-gray-300 uppercase">Clock Out</span>
                                        <input type="time" className="w-full text-xs bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pt-6 font-black focus:border-black outline-none" value={s.endTime} onChange={e => handleShiftUpdate(s.id, 'endTime', e.target.value)} />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </td>
                            );
                          })}
                          <td className="p-6 text-center">
                            <button
                              onClick={() => openDeleteRoleModal(dept.id, pos)}
                              className="text-gray-200 hover:text-red-500 p-4 rounded-2xl hover:bg-red-50 transition-all"
                            >
                              <i className="fas fa-trash-can text-xl"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'workers' && (
        <div className="space-y-8">
          {/* Student Availability Link Banner */}
          <div className="bg-indigo-50 border-2 border-indigo-100 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
                <i className="fas fa-link"></i>
              </div>
              <div>
                <p className="text-sm font-black text-indigo-900">Student Self-Service Availability Link</p>
                <p className="text-[11px] text-indigo-500 font-semibold mt-0.5">Share this link so students can submit their own busy blocks</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                readOnly
                value={availabilityLink}
                className="flex-1 sm:w-80 bg-white border-2 border-indigo-200 rounded-xl px-4 py-3 text-xs font-bold text-indigo-800 outline-none"
                onFocus={e => e.target.select()}
              />
              <button
                onClick={() => { navigator.clipboard.writeText(availabilityLink); }}
                className="bg-indigo-500 text-white px-5 py-3 rounded-xl font-black text-xs hover:bg-indigo-600 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <i className="fas fa-copy"></i> Copy
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-4xl font-black text-gray-900 tracking-tighter">Workers Registry</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Availability & Role Anchors</p>
              </div>
              <button
                onClick={openAddWorkerModal}
                className="bg-black text-white px-10 py-4 rounded-3xl font-black shadow-xl hover:scale-105 transition-transform flex items-center gap-3"
              >
                <i className="fas fa-user-plus"></i> Add New Worker
              </button>
            </div>

            {students.length === 0 ? (
              <div className="py-32 text-center bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
                 <i className="fas fa-ghost text-5xl text-gray-200 mb-6"></i>
                 <p className="text-2xl font-black text-gray-300">Roster is Empty</p>
              </div>
            ) : (
              <div className="space-y-8">
                {departments.map(dept => {
                  const deptStudents = sortedStudentsByDept[dept.id] || [];
                  if (deptStudents.length === 0) return null;
                  return (
                    <div key={dept.id}>
                      {/* Department Header */}
                      <div className={`${dept.color} rounded-t-2xl px-6 py-3 border-2 border-b-0 border-gray-100 flex items-center gap-3`}>
                        <i className="fas fa-layer-group text-gray-500 text-sm"></i>
                        <span className="text-[11px] font-black text-gray-700 uppercase tracking-[0.15em]">{dept.name}</span>
                        <span className="text-[10px] font-bold text-gray-400 ml-1">({deptStudents.length})</span>
                      </div>
                      {/* Workers List */}
                      <div className="border-2 border-gray-100 rounded-b-2xl overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-100">
                              <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest w-16"></th>
                              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Anchor Role</th>
                              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Busy Blocks</th>
                              <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest w-40">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deptStudents.map((stu, idx) => {
                              const isLead = stu.skill.toLowerCase().includes('lead') || stu.skill.toLowerCase().includes('apprenticeship');
                              return (
                                <tr key={stu.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-all group ${idx === 0 && isLead ? 'bg-amber-50/30' : ''}`}>
                                  <td className="px-6 py-3 text-center">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${isLead ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                                      {stu.name.charAt(0)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-sm text-gray-900">{stu.name}</span>
                                      {isLead && <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 rounded-md uppercase">Lead</span>}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs font-bold text-indigo-500 font-mono">{stu.idNumber || '—'}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs font-black text-gray-600 whitespace-normal">{stu.skill}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {stu.unavailability.length === 0 ? (
                                      <span className="text-[10px] text-gray-300 font-bold italic">Full availability</span>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5">
                                        {stu.unavailability.map((b, bIdx) => (
                                          <span key={bIdx} className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-red-100">
                                            {b.day.slice(0, 3)} {format12h(b.start)}-{format12h(b.end)}
                                            <button
                                              onClick={() => updateWorkerUnavailability(stu.id, stu.unavailability.filter((_, i) => i !== bIdx))}
                                              className="text-red-300 hover:text-red-600 ml-0.5"
                                            >
                                              <i className="fas fa-xmark text-[9px]"></i>
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => openBusyBlockModal(stu.id)}
                                        title="Add busy block"
                                        className="text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                      >
                                        <i className="fas fa-clock text-xs"></i>
                                      </button>
                                      <button
                                        onClick={() => openEditWorkerModal(stu)}
                                        title="Edit worker"
                                        className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                      >
                                        <i className="fas fa-pen text-xs"></i>
                                      </button>
                                      <button
                                        onClick={() => openTerminateModal(stu)}
                                        title="Terminate worker"
                                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                      >
                                        <i className="fas fa-user-minus text-xs"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════ MODALS ═══════════════════════════ */}

      {/* ── Add Shift Role Modal ─────────────────────────────────── */}
      <Modal isOpen={addRoleModal.open} onClose={() => setAddRoleModal({ open: false, deptId: '' })} size="sm">
        <ModalHeader
          icon="fa-layer-group"
          title="New Shift Role"
          subtitle="Define a new position for this department"
          onClose={() => setAddRoleModal({ open: false, deptId: '' })}
        />
        <ModalBody>
          <Field label="Role Name" hint='Examples: "Morning Lead", "Evening Line", "Prep Cook"' error={addRoleError}>
            <input
              className={inputClass}
              placeholder="Enter role name..."
              value={addRoleName}
              onChange={e => { setAddRoleName(e.target.value); setAddRoleError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') submitAddRole(); }}
              autoFocus
            />
          </Field>
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
            <i className="fas fa-info-circle text-gray-300"></i>
            <p className="text-[11px] text-gray-400 font-semibold">
              This will create shift slots for all 5 working days (Mon, Tue, Thu, Fri, Sat) with default times 09:00–13:00.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <BtnSecondary onClick={() => setAddRoleModal({ open: false, deptId: '' })}>Cancel</BtnSecondary>
          <BtnPrimary onClick={submitAddRole}>
            <i className="fas fa-plus mr-2"></i>Create Role
          </BtnPrimary>
        </ModalFooter>
      </Modal>

      {/* ── Confirm Delete Role Modal ────────────────────────────── */}
      <Modal isOpen={confirmDeleteModal.open} onClose={() => setConfirmDeleteModal({ open: false, deptId: '', roleName: '' })} size="sm">
        <ModalHeader
          icon="fa-trash-can"
          iconBg="bg-red-500"
          title="Remove Role"
          subtitle="This action cannot be undone"
          onClose={() => setConfirmDeleteModal({ open: false, deptId: '', roleName: '' })}
        />
        <ModalBody>
          <div className="bg-red-50 rounded-2xl p-6 border border-red-100 mb-2">
            <p className="text-sm text-red-800 font-bold leading-relaxed">
              Are you sure you want to remove the role <span className="font-black">"{confirmDeleteModal.roleName}"</span>? All associated shift data across all 5 working days will be permanently deleted.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <BtnSecondary onClick={() => setConfirmDeleteModal({ open: false, deptId: '', roleName: '' })}>Keep Role</BtnSecondary>
          <BtnDanger onClick={submitDeleteRole}>
            <i className="fas fa-trash-can mr-2"></i>Delete Role
          </BtnDanger>
        </ModalFooter>
      </Modal>

      {/* ── Add Worker Modal ─────────────────────────────────────── */}
      <Modal isOpen={addWorkerModal.open} onClose={() => setAddWorkerModal({ open: false })}>
        <ModalHeader
          icon="fa-user-plus"
          title="Add Worker"
          subtitle="Register a new team member"
          onClose={() => setAddWorkerModal({ open: false })}
        />
        <ModalBody>
          <ModalSection label="Personal Info">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" hint="Enter the worker's display name">
                <input
                  className={inputClass}
                  placeholder="e.g. Juan Dela Cruz"
                  value={workerForm.name}
                  onChange={e => { setWorkerForm(prev => ({ ...prev, name: e.target.value })); setWorkerFormError(''); }}
                  autoFocus
                />
              </Field>
              <Field label="ID Number" hint="Unique student/employee ID">
                <input
                  className={inputClass}
                  placeholder="e.g. 2081500"
                  value={workerForm.idNumber}
                  onChange={e => { setWorkerForm(prev => ({ ...prev, idNumber: e.target.value })); setWorkerFormError(''); }}
                />
              </Field>
            </div>
          </ModalSection>

          <ModalSection label="Assignment">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Department">
                <div className="relative">
                  <select
                    className={selectClass}
                    value={workerForm.deptId}
                    onChange={e => setWorkerForm(prev => ({ ...prev, deptId: e.target.value, skill: '' }))}
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs pointer-events-none"></i>
                </div>
              </Field>
              <Field label="Role Anchor" hint="Must match a defined role">
                <div className="relative">
                  <select
                    className={selectClass}
                    value={workerForm.skill}
                    onChange={e => { setWorkerForm(prev => ({ ...prev, skill: e.target.value })); setWorkerFormError(''); }}
                  >
                    <option value="">Select role...</option>
                    {selectedDeptPositions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs pointer-events-none"></i>
                </div>
              </Field>
            </div>
          </ModalSection>

          {workerFormError && (
            <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3 border border-red-100">
              <i className="fas fa-exclamation-circle text-red-400"></i>
              <p className="text-[11px] text-red-600 font-bold">{workerFormError}</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <BtnSecondary onClick={() => setAddWorkerModal({ open: false })}>Cancel</BtnSecondary>
          <BtnPrimary onClick={submitAddWorker}>
            <i className="fas fa-user-plus mr-2"></i>Add Worker
          </BtnPrimary>
        </ModalFooter>
      </Modal>

      {/* ── Edit Worker Modal ──────────────────────────────────── */}
      <Modal isOpen={editWorkerModal.open} onClose={() => setEditWorkerModal({ open: false, stuId: '' })}>
        <ModalHeader
          icon="fa-pen-to-square"
          title="Edit Worker"
          subtitle={`Editing: ${students.find(s => s.id === editWorkerModal.stuId)?.name || ''}`}
          onClose={() => setEditWorkerModal({ open: false, stuId: '' })}
        />
        <ModalBody>
          <ModalSection label="Identification">
            <Field label="ID Number" hint="Unique student/employee ID">
              <input
                className={inputClass}
                placeholder="e.g. 2081500"
                value={editWorkerForm.idNumber}
                onChange={e => { setEditWorkerForm(prev => ({ ...prev, idNumber: e.target.value })); setEditWorkerFormError(''); }}
                autoFocus
              />
            </Field>
          </ModalSection>

          <ModalSection label="Assignment">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Department">
                <div className="relative">
                  <select
                    className={selectClass}
                    value={editWorkerForm.deptId}
                    onChange={e => setEditWorkerForm(prev => ({ ...prev, deptId: e.target.value, skill: '' }))}
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs pointer-events-none"></i>
                </div>
              </Field>
              <Field label="Role Anchor" hint="Must match a defined role">
                <div className="relative">
                  <select
                    className={selectClass}
                    value={editWorkerForm.skill}
                    onChange={e => { setEditWorkerForm(prev => ({ ...prev, skill: e.target.value })); setEditWorkerFormError(''); }}
                  >
                    <option value="">Select role...</option>
                    {editDeptPositions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs pointer-events-none"></i>
                </div>
              </Field>
            </div>
          </ModalSection>

          {editWorkerFormError && (
            <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3 border border-red-100">
              <i className="fas fa-exclamation-circle text-red-400"></i>
              <p className="text-[11px] text-red-600 font-bold">{editWorkerFormError}</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <BtnSecondary onClick={() => setEditWorkerModal({ open: false, stuId: '' })}>Cancel</BtnSecondary>
          <BtnPrimary onClick={submitEditWorker}>
            <i className="fas fa-check mr-2"></i>Save Changes
          </BtnPrimary>
        </ModalFooter>
      </Modal>

      {/* ── Terminate Worker Confirmation Modal ────────────────── */}
      <Modal isOpen={terminateModal.open} onClose={() => setTerminateModal({ open: false, stuId: '', stuName: '' })} size="sm">
        <ModalHeader
          icon="fa-user-minus"
          iconBg="bg-red-500"
          title="Terminate Worker"
          subtitle="This action cannot be undone"
          onClose={() => setTerminateModal({ open: false, stuId: '', stuName: '' })}
        />
        <ModalBody>
          <div className="bg-red-50 rounded-2xl p-6 border border-red-100 mb-2">
            <p className="text-sm text-red-800 font-bold leading-relaxed">
              Are you sure you wish to proceed with termination of <span className="font-black">"{terminateModal.stuName}"</span>? This will remove them from the roster and all associated data.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <BtnSecondary onClick={() => setTerminateModal({ open: false, stuId: '', stuName: '' })}>Cancel</BtnSecondary>
          <BtnDanger onClick={submitTerminate}>
            <i className="fas fa-user-minus mr-2"></i>Terminate
          </BtnDanger>
        </ModalFooter>
      </Modal>

      {/* ── Add Busy Block Modal ─────────────────────────────────── */}
      <Modal isOpen={busyBlockModal.open} onClose={() => setBusyBlockModal({ open: false, stuId: '' })} size="sm">
        <ModalHeader
          icon="fa-user-lock"
          iconBg="bg-red-500"
          title="Add Busy Block"
          subtitle="Mark unavailable time window"
          onClose={() => setBusyBlockModal({ open: false, stuId: '' })}
        />
        <ModalBody>
          <Field label="Target Day">
            <div className="relative">
              <select
                className={selectClass}
                value={busyBlockForm.day}
                onChange={e => setBusyBlockForm(prev => ({ ...prev, day: e.target.value as DayOfWeek }))}
                autoFocus
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs pointer-events-none"></i>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Busy From">
              <input
                type="time"
                className={inputClass}
                value={busyBlockForm.start}
                onChange={e => { setBusyBlockForm(prev => ({ ...prev, start: e.target.value })); setBusyBlockError(''); }}
              />
              <p className="mt-1.5 text-[10px] text-gray-400 font-bold">{format12h(busyBlockForm.start)}</p>
            </Field>
            <Field label="Busy Until">
              <input
                type="time"
                className={inputClass}
                value={busyBlockForm.end}
                onChange={e => { setBusyBlockForm(prev => ({ ...prev, end: e.target.value })); setBusyBlockError(''); }}
              />
              <p className="mt-1.5 text-[10px] text-gray-400 font-bold">{format12h(busyBlockForm.end)}</p>
            </Field>
          </div>
          {busyBlockError && (
            <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3 border border-red-100 mt-1">
              <i className="fas fa-exclamation-circle text-red-400"></i>
              <p className="text-[11px] text-red-600 font-bold">{busyBlockError}</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <BtnSecondary onClick={() => setBusyBlockModal({ open: false, stuId: '' })}>Cancel</BtnSecondary>
          <BtnPrimary onClick={submitBusyBlock}>
            <i className="fas fa-lock mr-2"></i>Confirm Block
          </BtnPrimary>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Dashboard;
