import React from 'react';
import Reportanalytics from '../../Components/Pagecomponents/Reportanalytics';

const Reportspage = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 w-full">
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-gray-600">
            Track complaint trends, urgency levels, and resolution metrics
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm  overflow-hidden mb-6">
          <Reportanalytics />
        </div>
        
      </div>
    </div>
  );
};

export default Reportspage;
