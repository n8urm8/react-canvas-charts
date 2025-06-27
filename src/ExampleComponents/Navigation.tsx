import React from 'react';

interface NavigationProps {
  currentPage: 'main' | 'linechart';
  onPageChange: (page: 'main' | 'linechart') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-8 py-4">
          <button
            onClick={() => onPageChange('main')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
              currentPage === 'main'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            📊 Main Demo
          </button>
          <button
            onClick={() => onPageChange('linechart')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
              currentPage === 'linechart'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
          >
            📈 LineChart Showcase
          </button>
        </div>
      </div>
    </nav>
  );
}; 