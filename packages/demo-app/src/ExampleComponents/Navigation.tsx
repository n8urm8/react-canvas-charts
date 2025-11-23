import React from 'react';
import { Link, useLocation } from 'react-router';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const getLinkClass = (path: string) => {
    return `px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
      currentPath === path
        ? 'bg-blue-500 text-white shadow-md'
        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
    }`;
  };

  const getShowcaseLinkClass = () => {
    return `px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
      currentPath === '/linechart-showcase'
        ? 'bg-green-500 text-white shadow-md'
        : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
    }`;
  };

  const getInteractiveLinkClass = () => {
    return `px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
      currentPath === '/interactive'
        ? 'bg-purple-500 text-white shadow-md'
        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
    }`;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 mb-8 w-full">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-8 py-4">
          <Link to="/" className={getLinkClass('/')}>
            📊 Main Demo
          </Link>
          <Link to="/linechart-showcase" className={getShowcaseLinkClass()}>
            📈 LineChart Showcase
          </Link>
          <Link to="/interactive" className={getInteractiveLinkClass()}>
            🎮 Interactive Demo
          </Link>
        </div>
      </div>
    </nav>
  );
}; 