// Salepage.jsx - Clean and simplified with imported table
import React from 'react';
import NotifTable from '../../Components/Pagecomponents/Notiftable';

const Salepage = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Notifications</h1>
        <p className="text-gray-600">Manage and track community complaints and issues</p>
      </div>

      {/* Notification Table Component */}
      
      <NotifTable />
    </div>
  );
};

export default Salepage;