
import React, { useEffect, useRef } from 'react';

// ─── Base Modal Shell ─────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, size = 'md' }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[6px]" onClick={onClose} />
      <div
        ref={panelRef}
        className={`relative bg-white rounded-[2rem] shadow-[0_32px_80px_-12px_rgba(0,0,0,0.25)] border border-gray-100 w-full ${sizeMap[size]} overflow-hidden`}
        style={{ animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {children}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ─── Modal Header ─────────────────────────────────────────────────
interface ModalHeaderProps {
  icon: string;
  iconBg?: string;
  title: string;
  subtitle: string;
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ icon, iconBg = 'bg-black', title, subtitle, onClose }) => (
  <div className="flex items-center justify-between px-10 pt-10 pb-6">
    <div className="flex items-center gap-5">
      <div className={`${iconBg} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg`}>
        <i className={`fas ${icon} text-white text-lg`}></i>
      </div>
      <div>
        <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{title}</h3>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{subtitle}</p>
      </div>
    </div>
    <button
      onClick={onClose}
      className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
    >
      <i className="fas fa-xmark text-lg"></i>
    </button>
  </div>
);

// ─── Modal Body ───────────────────────────────────────────────────
export const ModalBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-10 pb-4">{children}</div>
);

// ─── Modal Footer ─────────────────────────────────────────────────
export const ModalFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-10 pb-10 pt-4 flex items-center justify-end gap-3">{children}</div>
);

// ─── Section Divider ──────────────────────────────────────────────
export const ModalSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-grow bg-gray-100"></div>
      <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] shrink-0">{label}</span>
      <div className="h-px flex-grow bg-gray-100"></div>
    </div>
    {children}
  </div>
);

// ─── Styled Input ─────────────────────────────────────────────────
interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  error?: string;
}

export const Field: React.FC<FieldProps> = ({ label, hint, children, error }) => (
  <div className="mb-5">
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</label>
    {children}
    {hint && !error && <p className="mt-1.5 text-[10px] text-gray-300 font-semibold">{hint}</p>}
    {error && <p className="mt-1.5 text-[10px] text-red-500 font-bold">{error}</p>}
  </div>
);

// ─── Button presets ───────────────────────────────────────────────
export const BtnPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...props }) => (
  <button
    className={`bg-black text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all shadow-lg active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const BtnSecondary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...props }) => (
  <button
    className={`bg-gray-100 text-gray-600 px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all active:scale-[0.97] ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const BtnDanger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...props }) => (
  <button
    className={`bg-red-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-red-600 transition-all shadow-lg active:scale-[0.97] ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Shared input class
export const inputClass =
  'w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 placeholder-gray-300 focus:border-black focus:bg-white outline-none transition-all';

export const selectClass =
  'w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:border-black focus:bg-white outline-none transition-all appearance-none';

export default Modal;
