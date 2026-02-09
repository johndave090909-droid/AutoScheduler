
import React, { useState, useEffect } from 'react';
import { Student, DayOfWeek, ClassBlock } from '../types';
import { DAYS } from '../constants';

interface StudentPortalProps {
  student: Student;
  onUpdate: (updatedStudent: Student) => void;
}

const format12h = (time24: string): string => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
};

const StudentPortal: React.FC<StudentPortalProps> = ({ student, onUpdate }) => {
  const [blocks, setBlocks] = useState<ClassBlock[]>(student.unavailability || []);
  const [newDay, setNewDay] = useState<DayOfWeek>('Monday');
  const [newStart, setNewStart] = useState<string>('09:00');
  const [newEnd, setNewEnd] = useState<string>('12:00');
  const [error, setError] = useState('');

  // Sync local state when student prop changes
  useEffect(() => {
    setBlocks(student.unavailability || []);
  }, [student.unavailability]);

  const addBlock = () => {
    if (newStart >= newEnd) {
      setError('Start time must occur before end time.');
      return;
    }
    setError('');
    const updated = [...blocks, { day: newDay, start: newStart, end: newEnd }];
    setBlocks(updated);
    onUpdate({ ...student, unavailability: updated });
  };

  const removeBlock = (index: number) => {
    const updated = blocks.filter((_, i) => i !== index);
    setBlocks(updated);
    onUpdate({ ...student, unavailability: updated });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="bg-white rounded-[3.5rem] shadow-2xl border-4 border-gray-50 overflow-hidden">
        <div className="bg-gray-900 p-12 text-white flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-black tracking-tighter mb-2">My "Busy" Blocks</h2>
            <p className="text-indigo-400 font-bold uppercase text-xs tracking-widest">Mark Unavailability for the Matrix Engine</p>
          </div>
          <div className="bg-white/10 p-5 rounded-3xl border border-white/10 text-center">
            <p className="text-[10px] font-black uppercase opacity-60 mb-1">Weekly Target</p>
            <p className="text-2xl font-black">5 Shifts</p>
          </div>
        </div>

        <div className="p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <i className="fas fa-user-lock text-red-500"></i>
                Define Constraint
              </h3>
              <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-6 border-2 border-gray-100 shadow-sm">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Target Day</label>
                  <select
                    className="w-full bg-white border-2 border-gray-200 rounded-2xl p-4 text-sm font-black focus:border-black outline-none transition-all"
                    value={newDay} onChange={e => setNewDay(e.target.value as DayOfWeek)}
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Busy From</label>
                    <input type="time" className="w-full bg-white border-2 border-gray-200 rounded-2xl p-4 text-sm font-black focus:border-black outline-none transition-all" value={newStart} onChange={e => { setNewStart(e.target.value); setError(''); }} />
                    <p className="mt-2 text-[10px] text-gray-400 font-bold">{format12h(newStart)}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Busy Until</label>
                    <input type="time" className="w-full bg-white border-2 border-gray-200 rounded-2xl p-4 text-sm font-black focus:border-black outline-none transition-all" value={newEnd} onChange={e => { setNewEnd(e.target.value); setError(''); }} />
                    <p className="mt-2 text-[10px] text-gray-400 font-bold">{format12h(newEnd)}</p>
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3 border border-red-100">
                    <i className="fas fa-exclamation-circle text-red-400"></i>
                    <p className="text-[11px] text-red-600 font-bold">{error}</p>
                  </div>
                )}
                <button
                  onClick={addBlock}
                  className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all shadow-xl active:scale-95"
                >
                  Confirm Busy Block
                </button>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <i className="fas fa-calendar-check text-gray-400"></i>
                Active Constraints
              </h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {blocks.length === 0 ? (
                  <div className="py-20 border-4 border-dashed border-gray-50 rounded-[3rem] text-center flex flex-col items-center">
                     <i className="fas fa-smile text-gray-200 text-5xl mb-4"></i>
                     <p className="text-gray-300 font-black uppercase tracking-widest text-xs">Full Availability Detected</p>
                  </div>
                ) : (
                  blocks.map((b, i) => (
                    <div key={i} className="flex justify-between items-center bg-white border-2 border-gray-100 p-6 rounded-3xl shadow-sm hover:border-black transition-all group">
                      <div>
                        <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">{b.day}</div>
                        <div className="text-lg font-black text-gray-800">{format12h(b.start)} — {format12h(b.end)}</div>
                      </div>
                      <button onClick={() => removeBlock(i)} className="bg-gray-50 group-hover:bg-red-50 text-gray-300 group-hover:text-red-500 w-12 h-12 rounded-2xl transition-all flex items-center justify-center">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
