
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <i className="fas fa-utensils text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">CulinaSched</h1>
              <p className="text-xs text-gray-500 font-medium">Culinary Department Optimizer</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">Documentation</button>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">System:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
