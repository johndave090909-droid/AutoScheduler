
import React, { useState, useEffect, useRef } from 'react';
import { Student, DayOfWeek, ClassBlock } from '../types';
import { DAYS } from '../constants';
import { subscribeStudents, saveStudent } from '../services/firestoreService';

const format12h = (time24: string): string => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
};

const StudentAvailability: React.FC = () => {
  const [idInput, setIdInput] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loginError, setLoginError] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Draft state — local edits before submission
  const [draftBlocks, setDraftBlocks] = useState<ClassBlock[]>([]);
  const [draftFileUrl, setDraftFileUrl] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Busy block form
  const [newDay, setNewDay] = useState<DayOfWeek>('Monday');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('12:00');
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to Firestore students for real-time data
  useEffect(() => {
    const unsub = subscribeStudents(
      (firestoreStudents) => {
        setStudents(firestoreStudents);
        setLoaded(true);
      },
      () => { setLoaded(true); }
    );
    return () => unsub();
  }, []);

  // When student logs in, initialize draft from their current data
  useEffect(() => {
    if (student) {
      setDraftBlocks([...student.unavailability]);
      setDraftFileUrl(student.scheduleFileUrl || '');
      setIsDirty(false);
      setSubmitted(false);
    }
  }, [student?.id]);

  const handleLogin = () => {
    const trimmed = idInput.trim();
    if (!trimmed) { setLoginError('Please enter your Student ID'); return; }
    const found = students.find(s => s.idNumber === trimmed);
    if (!found) { setLoginError('No student found with this ID. Please check and try again.'); return; }
    setStudent(found);
    setLoginError('');
  };

  const addBlock = () => {
    if (newStart >= newEnd) {
      setError('Start time must occur before end time.');
      return;
    }
    setError('');
    setDraftBlocks(prev => [...prev, { day: newDay, start: newStart, end: newEnd }]);
    setIsDirty(true);
  };

  const removeBlock = (index: number) => {
    setDraftBlocks(prev => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Please upload an image (JPG, PNG) or PDF file.');
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraftFileUrl(reader.result as string);
      setIsDirty(true);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setDraftFileUrl('');
    setIsDirty(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!draftFileUrl) {
      setError('Please upload your semester schedule before submitting.');
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    if (!student) return;
    const updated: Student = {
      ...student,
      unavailability: draftBlocks,
      scheduleFileUrl: draftFileUrl,
      availabilityStatus: 'submitted'
    };
    saveStudent(updated);
    setStudent(updated);
    setIsDirty(false);
    setShowConfirm(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  // Loading state
  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-cog fa-spin text-4xl text-gray-300 mb-4"></i>
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[3rem] shadow-2xl border-4 border-gray-50 overflow-hidden">
            <div className="bg-gray-900 p-10 text-center">
              <div className="bg-white/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10">
                <i className="fas fa-calendar-check text-white text-3xl"></i>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter">Availability Portal</h1>
              <p className="text-indigo-400 font-bold uppercase text-[11px] tracking-widest mt-2">CulinaSched Self-Service</p>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Student ID</label>
                <input
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 text-lg font-black text-center tracking-widest focus:border-black outline-none transition-all"
                  placeholder="e.g. 2081500"
                  value={idInput}
                  onChange={e => { setIdInput(e.target.value); setLoginError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                  autoFocus
                />
              </div>
              {loginError && (
                <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3 border border-red-100">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                  <p className="text-[11px] text-red-600 font-bold">{loginError}</p>
                </div>
              )}
              <button
                onClick={handleLogin}
                className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all shadow-xl active:scale-95"
              >
                <i className="fas fa-arrow-right-to-bracket mr-2"></i>
                Access My Schedule
              </button>
              <p className="text-[10px] text-gray-300 font-bold text-center">No password required. Enter your Student ID to continue.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const alreadySubmitted = student.availabilityStatus === 'submitted' && !isDirty;

  // Availability editor
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-100 sticky top-0 z-50 backdrop-blur-lg bg-white/90">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="bg-black p-3 rounded-[1rem] shadow-xl">
                <i className="fas fa-utensils text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tighter leading-none">CulinaSched</h1>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Availability Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {submitted && (
                <span className="text-[11px] font-black text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-100 animate-pulse">
                  <i className="fas fa-check mr-1"></i> Submitted
                </span>
              )}
              {isDirty && (
                <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                  <i className="fas fa-pen mr-1"></i> Draft
                </span>
              )}
              <div className="hidden sm:flex items-center space-x-3 text-sm text-gray-900 bg-gray-50 px-4 py-2 rounded-xl border-2 border-gray-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-black text-xs">{student.name}</span>
                <span className="text-[10px] font-bold text-indigo-500 font-mono">{student.idNumber}</span>
              </div>
              <button
                onClick={() => setStudent(null)}
                className="text-xs bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-xl font-black transition-all flex items-center space-x-2 shadow-sm"
              >
                <i className="fas fa-power-off"></i>
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Student info card */}
        <div className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{student.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] font-bold text-indigo-500 font-mono bg-indigo-50 px-2 py-0.5 rounded">ID: {student.idNumber}</span>
                <span className="text-[11px] font-bold text-gray-400">{student.skill}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Busy Blocks</p>
              <p className="text-2xl font-black text-gray-900">{draftBlocks.length}</p>
            </div>
            {alreadySubmitted && (
              <div className="bg-green-50 px-5 py-3 rounded-2xl border border-green-200 text-center">
                <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Status</p>
                <p className="text-sm font-black text-green-700"><i className="fas fa-check-circle mr-1"></i>Submitted</p>
              </div>
            )}
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 overflow-hidden mb-8">
          <div className="bg-gray-900 px-8 py-5 flex items-center gap-3">
            <i className="fas fa-file-image text-indigo-400"></i>
            <h3 className="text-lg font-black text-white tracking-tight">Semester Schedule Upload</h3>
            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest ml-2 bg-red-500/10 px-2 py-1 rounded-lg">Required</span>
          </div>
          <div className="p-8">
            {draftFileUrl ? (
              <div className="space-y-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                      <i className="fas fa-file-circle-check text-xl"></i>
                    </div>
                    <div>
                      <p className="text-sm font-black text-green-800">Schedule Uploaded</p>
                      <p className="text-[10px] text-green-600 font-bold mt-0.5">File ready for submission</p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="text-xs bg-white text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl font-black border border-red-200 transition-all"
                  >
                    <i className="fas fa-trash-alt mr-1"></i> Remove
                  </button>
                </div>
                {draftFileUrl.startsWith('data:image') && (
                  <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
                    <img src={draftFileUrl} alt="Schedule preview" className="max-h-64 w-full object-contain bg-gray-50" />
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-gray-200 rounded-3xl py-16 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
              >
                <i className="fas fa-cloud-arrow-up text-4xl text-gray-300 group-hover:text-indigo-400 mb-4 transition-colors"></i>
                <p className="text-sm font-black text-gray-400 group-hover:text-indigo-600 transition-colors">Click to upload your semester schedule</p>
                <p className="text-[10px] text-gray-300 font-bold mt-2">Accepts JPG, PNG, or PDF (max 5MB)</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add block form */}
          <div className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 overflow-hidden">
            <div className="bg-gray-900 px-8 py-5 flex items-center gap-3">
              <i className="fas fa-plus-circle text-indigo-400"></i>
              <h3 className="text-lg font-black text-white tracking-tight">Add Busy Block</h3>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Day</label>
                <select
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 text-sm font-black focus:border-black outline-none transition-all"
                  value={newDay} onChange={e => setNewDay(e.target.value as DayOfWeek)}
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">From</label>
                  <input type="time" className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 text-sm font-black focus:border-black outline-none transition-all" value={newStart} onChange={e => { setNewStart(e.target.value); setError(''); }} />
                  <p className="mt-1 text-[10px] text-gray-400 font-bold">{format12h(newStart)}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Until</label>
                  <input type="time" className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 text-sm font-black focus:border-black outline-none transition-all" value={newEnd} onChange={e => { setNewEnd(e.target.value); setError(''); }} />
                  <p className="mt-1 text-[10px] text-gray-400 font-bold">{format12h(newEnd)}</p>
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
                className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all shadow-xl active:scale-95"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Busy Block
              </button>
            </div>
          </div>

          {/* Current blocks */}
          <div className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 overflow-hidden">
            <div className="bg-gray-900 px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="fas fa-calendar-xmark text-red-400"></i>
                <h3 className="text-lg font-black text-white tracking-tight">My Busy Blocks</h3>
              </div>
              <span className="text-[11px] font-bold text-white/50">{draftBlocks.length} active</span>
            </div>
            <div className="p-6">
              {draftBlocks.length === 0 ? (
                <div className="py-16 text-center border-4 border-dashed border-gray-50 rounded-3xl">
                  <i className="fas fa-smile text-gray-200 text-4xl mb-3"></i>
                  <p className="text-gray-300 font-black uppercase tracking-widest text-xs">Full Availability</p>
                  <p className="text-[10px] text-gray-300 font-semibold mt-1">No busy blocks set for this week</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {draftBlocks.map((b, i) => (
                    <div key={i} className="flex justify-between items-center bg-white border-2 border-gray-100 p-5 rounded-2xl shadow-sm hover:border-red-200 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                          <i className="fas fa-ban text-sm"></i>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.15em]">{b.day}</div>
                          <div className="text-sm font-black text-gray-800 mt-0.5">{format12h(b.start)} — {format12h(b.end)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeBlock(i)}
                        className="bg-gray-50 group-hover:bg-red-50 text-gray-300 group-hover:text-red-500 w-10 h-10 rounded-xl transition-all flex items-center justify-center"
                      >
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="mt-8 bg-white rounded-3xl shadow-sm border-2 border-gray-100 p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${!draftFileUrl ? 'bg-red-50 text-red-400' : isDirty ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'}`}>
                <i className={`fas ${!draftFileUrl ? 'fa-exclamation-triangle' : isDirty ? 'fa-cloud-arrow-up' : 'fa-check-circle'} text-xl`}></i>
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">
                  {!draftFileUrl ? 'Upload Required' : isDirty ? 'Unsaved Changes' : 'All Changes Submitted'}
                </p>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                  {!draftFileUrl
                    ? 'You must upload your semester schedule before submitting.'
                    : isDirty
                    ? 'Your changes are in draft mode. Click Submit to send to the Admin.'
                    : 'Your availability has been submitted for review.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!isDirty || !draftFileUrl}
              className={`px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center gap-3 ${
                isDirty && draftFileUrl
                  ? 'bg-black text-white hover:bg-gray-800 active:scale-95'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <i className="fas fa-paper-plane"></i>
              Submit to Admin
            </button>
          </div>
        </div>

        <div className="mt-6 bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex items-center gap-3">
          <i className="fas fa-info-circle text-amber-400"></i>
          <p className="text-[11px] text-amber-700 font-semibold">
            Your changes are saved as a draft until you click "Submit to Admin". Only submitted data is visible to the administrator.
          </p>
        </div>
      </main>

      <footer className="bg-white border-t-2 border-gray-50 py-8 mt-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.3em]">
            &copy; 2025 CulinaSched Availability Portal
          </p>
        </div>
      </footer>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center px-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gray-900 p-8 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                <i className="fas fa-paper-plane text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Confirm Submission</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-5">
                <p className="text-sm text-amber-800 font-bold leading-relaxed">
                  Are you sure? Once submitted, your schedule will be sent to the Admin for review. You can still make changes and resubmit later.
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-gray-400">Busy Blocks</span>
                  <span className="font-black text-gray-800">{draftBlocks.length}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-gray-400">Schedule File</span>
                  <span className="font-black text-green-600"><i className="fas fa-check mr-1"></i>Attached</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all shadow-xl active:scale-95"
                >
                  <i className="fas fa-check mr-2"></i>Yes, Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAvailability;
