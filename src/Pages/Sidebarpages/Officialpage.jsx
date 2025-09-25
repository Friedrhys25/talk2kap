// Officialpage.jsx
import React from "react";
import OfficialTable from "../../Components/Pagecomponents/Officialtable";

const Officialpage = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Barangay Officials
        </h1>
        <p className="text-gray-600">
          Feedbacks, ratings, and complaints about specific officials
        </p>
      </div>

      {/* Officials Table Component */}
      <OfficialTable />
    </div>
  );
};

export default Officialpage;
