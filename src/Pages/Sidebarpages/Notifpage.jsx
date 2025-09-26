// Salepage.jsx - Clean and simplified with imported table
import React from 'react';
import NotifTable from '../../Components/Pagecomponents/Notiftable';

const Salepage = () => {
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-gray-50">
      <div className="p-6 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Notifications</h1>
          <p className="text-gray-600">Manage and track community complaints and issues</p>
        </div>

        {/* Notification Table Component */}
        <div className="bg-white rounded-lg  overflow-hidden mb-6">
          <NotifTable />
        </div>
      </div>
    </div>
  );
};

export default Salepage;