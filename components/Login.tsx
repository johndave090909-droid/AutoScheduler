
import React, { useState } from 'react';
import { ADMIN_CREDENTIALS } from '../constants';
import { Student } from '../types';

interface LoginProps {
  onLogin: (role: 'admin' | 'student', user?: Student) => void;
  students: Student[];
}

const Login: React.FC<LoginProps> = ({ onLogin, students }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      onLogin('admin');
      return;
    }

    const student = students.find(s => s.id === username && s.password === password);
    if (student) {
      onLogin('student', student);
    } else {
      setError('Invalid ID or Password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-10">
          <div className="bg-indigo-600 inline-block p-4 rounded-2xl mb-4 shadow-lg">
            <i className="fas fa-utensils text-white text-3xl"></i>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">CulinaSched</h2>
          <p className="text-gray-500 mt-2">Enter credentials to access the engine</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">User ID / Admin Username</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. STU-101 or admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium flex items-center space-x-2">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Forgot password? Contact department admin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
