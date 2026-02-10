
import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import StudentPortal from './components/StudentPortal';
import StudentAvailability from './components/StudentAvailability';
import { Student } from './types';
import { subscribeStudents, saveStudents, saveStudent } from './services/firestoreService';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'student' | null>(null);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Check if this is the student availability portal
  const isAvailabilityPortal = new URLSearchParams(window.location.search).get('availability') === 'true';

  // Track whether a local update is pending so we don't echo Firestore snapshots back
  const pendingWrite = useRef(false);

  // Subscribe to Firestore students collection (real-time)
  useEffect(() => {
    const unsub = subscribeStudents(
      (firestoreStudents) => {
        if (!pendingWrite.current) {
          setStudents(firestoreStudents);
        }
        setInitialized(true);
      },
      (_err) => {
        // Firestore failed (e.g. permission denied) — still initialize with empty data
        setInitialized(true);
      }
    );
    return () => unsub();
  }, []);

  // Write students to Firestore when changed locally
  const updateStudents = (next: Student[]) => {
    setStudents(next);
    pendingWrite.current = true;
    saveStudents(next).finally(() => { pendingWrite.current = false; });
  };

  const handleLogin = (role: 'admin' | 'student', user?: Student) => {
    setUserRole(role);
    if (user) setCurrentUser(user);
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
  };

  const updateStudentInfo = (updated: Student) => {
    const next = students.map(s => s.id === updated.id ? updated : s);
    setStudents(next);
    setCurrentUser(updated);
    saveStudent(updated);
  };

  if (!initialized) return null;

  // Student availability portal — standalone page, no login required
  if (isAvailabilityPortal) {
    return <StudentAvailability />;
  }

  if (!userRole) {
    return <Login onLogin={handleLogin} students={students} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b-2 border-gray-100 sticky top-0 z-50 backdrop-blur-lg bg-white/90">
        <div className="max-w-[1800px] mx-auto px-6">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center space-x-4">
              <div className="bg-black p-3.5 rounded-[1.25rem] shadow-xl">
                <i className="fas fa-utensils text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">CulinaSched</h1>
                <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest mt-1">
                  {userRole === 'admin' ? 'Administrative Control' : 'Student Access'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center space-x-3 text-sm text-gray-900 bg-gray-50 px-5 py-2.5 rounded-2xl border-2 border-gray-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-black">{userRole === 'admin' ? 'System Administrator' : currentUser?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-6 py-3 rounded-2xl font-black transition-all flex items-center space-x-3 shadow-sm"
              >
                <i className="fas fa-power-off"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {userRole === 'admin' ? (
          <Dashboard students={students} onUpdateStudents={updateStudents} />
        ) : (
          currentUser && <StudentPortal student={currentUser} onUpdate={updateStudentInfo} />
        )}
      </main>

      <footer className="bg-white border-t-2 border-gray-50 py-12">
        <div className="max-w-[1800px] mx-auto px-6 text-center">
          <p className="text-[11px] text-gray-300 font-black uppercase tracking-[0.3em]">
            &copy; 2025 Labor Continuity Framework &bull; Strictly Private
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
