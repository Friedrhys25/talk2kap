// Officialpage.jsx - Updated to match Salepage layout
import React from "react";
import OfficialTable from "../../Components/Pagecomponents/Officialtable";

const Officialpage = () => {
  return (
    <div className=" flex flex-col w-full h-full p-6 bg-white overflow-auto" style={{width: '100%', margin: 0, padding: 0}}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Barangay Officials
        </h1>
        <p className="text-gray-600">
          Feedbacks, ratings, and complaints about specific officials
        </p>
      </div>
      <div className="">
        {/* Officials Table Component */}
        <OfficialTable />
      </div>
      
    </div>
  );
};

export default Officialpage;