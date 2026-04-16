// src/Pages/Sidebarpages/Emergencypage.jsx
import React from "react";
import { FiPhone } from "react-icons/fi";
import Emergency from "../../Components/Pagecomponents/emergency";

const Emergencypage = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-linear-to-br from-gray-50 via-rose-50 to-indigo-50 w-full">
      <div className="p-6 flex-1 overflow-y-auto">

        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-1 w-16 bg-linear-to-r from-transparent to-rose-500 rounded-full" />
            <FiPhone className="text-rose-600 text-4xl animate-pulse" />
            <div className="h-1 w-16 bg-linear-to-l from-transparent to-rose-500 rounded-full" />
          </div>

          <h1 className="text-6xl font-extrabold bg-linear-to-r from-rose-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            Emergency Hotlines
          </h1>

          <p className="text-gray-600 text-lg font-medium">
            Manage and publish emergency contacts visible to all app users
          </p>

          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <Emergency />
        </div>

      </div>
    </div>
  );
};

export default Emergencypage;