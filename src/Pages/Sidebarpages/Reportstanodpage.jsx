import React from 'react';
import { FiBarChart } from 'react-icons/fi';
import Reportstanod from '../../Components/Pagecomponents/Reportstanod';

const Reportstanodpage = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 w-full">
      <div className="p-6 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-1 w-16 bg-linear-to-r from-transparent to-indigo-500 rounded-full"></div>
            <FiBarChart className="text-indigo-600 text-4xl animate-pulse" />
            <div className="h-1 w-16 bg-linear-to-l from-transparent to-indigo-500 rounded-full"></div>
          </div>

          <h1 className="text-6xl font-extrabold bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Tanod Deployment Reports
          </h1>

          <p className="text-gray-600 text-lg font-medium">
            Track deployment history, resolution rates, and tanod performance metrics
          </p>

          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <Reportstanod />
        </div>
      </div>
    </div>
  );
};

export default Reportstanodpage;