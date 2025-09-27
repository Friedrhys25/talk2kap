// Officialpage.jsx - Updated to match Salepage layout
import React from "react";
import OfficialTable from "../../Components/Pagecomponents/Officialtable";

const Officialpage = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 w-full">
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Barangay Officials
          </h1>
          <p className="text-gray-600">
            Feedbacks, ratings, and complaints about specific officials
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm  overflow-hidden mb-6">
          <OfficialTable/>
        </div>
        
      </div>
    </div>
  );
};

export default Officialpage;