
import React, { useState } from 'react';
import { PYTHON_CODE_TEMPLATE } from '../constants';

const PythonCodeBlock: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(PYTHON_CODE_TEMPLATE.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl mt-8">
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <i className="fab fa-python text-yellow-400"></i>
          <span className="text-sm font-mono text-gray-300">scheduler_engine.py</span>
        </div>
        <button 
          onClick={copyToClipboard}
          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center space-x-2"
        >
          <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>
      <div className="p-6 overflow-auto max-h-[600px]">
        <pre className="text-sm font-mono text-indigo-300 whitespace-pre">
          <code>{PYTHON_CODE_TEMPLATE.trim()}</code>
        </pre>
      </div>
    </div>
  );
};

export default PythonCodeBlock;
