// HoverDevCards.jsx - Updated with click functionality and urgent/non-urgent
import React from "react";
import { FiMail, FiArrowLeft, FiAlertTriangle, FiClock } from "react-icons/fi";

const HoverDevCards = ({ onPurokSelect, selectedPurok, onBackToDashboard }) => {
  // Sample data for each purok with urgent/non-urgent counts
  const purokStats = {
    1: { urgent: 8, nonUrgent: 4 },
    2: { urgent: 3, nonUrgent: 5 },
    3: { urgent: 12, nonUrgent: 3 },
    4: { urgent: 5, nonUrgent: 5 },
    5: { urgent: 2, nonUrgent: 4 },
    6: { urgent: 9, nonUrgent: 5 }
  };

  // Show selected purok info if one is selected
  if (selectedPurok) {
    return <PurokInfo purokNumber={selectedPurok} onBack={onBackToDashboard} />;
  }

  // Show dashboard cards
  return (
    <div className="p-4 flex items-center justify-center flex-col">
      <p className="text-5xl font-semibold mb-8 block">Dashboard</p>

      <div className="grid gap-6 grid-cols-6 lg:grid-cols-5 md:grid-cols-2 sm:grid-cols-1">
        <Card 
          title="Purok 1" 
          Icon={FiMail} 
          onClick={() => onPurokSelect(1)}
          urgent={purokStats[1].urgent}
          nonUrgent={purokStats[1].nonUrgent}
        />
        <Card 
          title="Purok 2" 
          Icon={FiMail} 
          onClick={() => onPurokSelect(2)}
          urgent={purokStats[2].urgent}
          nonUrgent={purokStats[2].nonUrgent}
        />
        <Card 
          title="Purok 3" 
          Icon={FiMail} 
          onClick={() => onPurokSelect(3)}
          urgent={purokStats[3].urgent}
          nonUrgent={purokStats[3].nonUrgent}
        />
        <Card 
          title="Purok 4" 
          Icon={FiMail} 
          onClick={() => onPurokSelect(4)}
          urgent={purokStats[4].urgent}
          nonUrgent={purokStats[4].nonUrgent}
        />
        <Card 
          title="Purok 5" 
          Icon={FiMail} 
          onClick={() => onPurokSelect(5)}
          urgent={purokStats[5].urgent}
          nonUrgent={purokStats[5].nonUrgent}
        />
        <Card 
          title="Purok 6" 
          Icon={FiMail} 
          onClick={() => onPurokSelect(6)}
          urgent={purokStats[6].urgent}
          nonUrgent={purokStats[6].nonUrgent}
        />
      </div>
    </div>
  );
};

const Card = ({ title, Icon, onClick, urgent, nonUrgent }) => {
  const total = urgent + nonUrgent;
  
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded border-[1px] border-slate-300 relative overflow-hidden group bg-white hover:cursor-pointer transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-800 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300" />

      <Icon className="absolute z-10 -top-12 -right-12 text-9xl text-slate-100 group-hover:text-violet-500 group-hover:rotate-12 transition-transform duration-300" />
      
      {/* Main Icon */}
      <Icon className="mb-2 text-2xl text-violet-600 group-hover:text-white transition-colors relative z-10 duration-300" />
      
      {/* Title */}
      <h3 className="font-medium text-lg text-slate-950 group-hover:text-white relative z-10 duration-300 mb-3">
        {title}
      </h3>
      
      {/* Stats Section */}
      <div className="relative z-10 space-y-2">
        {/* Total Count */}
        <div className="text-sm font-semibold text-slate-700 group-hover:text-white transition-colors duration-300">
          Total: {total}
        </div>
        
        {/* Urgent/Non-Urgent Stats */}
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1 text-red-600 group-hover:text-red-200 transition-colors duration-300">
            <FiAlertTriangle size={12} />
            <span>Urgent: {urgent}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600 group-hover:text-blue-200 transition-colors duration-300">
            <FiClock size={12} />
            <span>Normal: {nonUrgent}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 group-hover:bg-gray-300 transition-colors duration-300">
          <div 
            className="bg-red-500 h-2 rounded-full transition-all duration-300"
            style={{ width: total > 0 ? `${(urgent / total) * 100}%` : '0%' }}
          ></div>
        </div>
      </div>
    </button>
  );
};

// PurokInfo.jsx - Component to show individual purok information
const PurokInfo = ({ purokNumber, onBack }) => {
  // Sample data - you can replace this with real data
  const purokData = {
    1: {
      name: "Purok 1",
      description: "Information about Purok 1",
      residents: 150,
      complaints: 12,
      resolved: 8,
      pending: 4,
      urgent: 8,
      nonUrgent: 4,
      urgentResolved: 5,
      urgentPending: 3,
      nonUrgentResolved: 3,
      nonUrgentPending: 1
    },
    2: {
      name: "Purok 2", 
      description: "Information about Purok 2",
      residents: 175,
      complaints: 8,
      resolved: 6,
      pending: 2,
      urgent: 3,
      nonUrgent: 5,
      urgentResolved: 2,
      urgentPending: 1,
      nonUrgentResolved: 4,
      nonUrgentPending: 1
    },
    3: {
      name: "Purok 3",
      description: "Information about Purok 3", 
      residents: 200,
      complaints: 15,
      resolved: 10,
      pending: 5,
      urgent: 12,
      nonUrgent: 3,
      urgentResolved: 8,
      urgentPending: 4,
      nonUrgentResolved: 2,
      nonUrgentPending: 1
    },
    4: {
      name: "Purok 4",
      description: "Information about Purok 4",
      residents: 180,
      complaints: 10,
      resolved: 7,
      pending: 3,
      urgent: 5,
      nonUrgent: 5,
      urgentResolved: 4,
      urgentPending: 1,
      nonUrgentResolved: 3,
      nonUrgentPending: 2
    },
    5: {
      name: "Purok 5",
      description: "Information about Purok 5",
      residents: 165,
      complaints: 6,
      resolved: 4,
      pending: 2,
      urgent: 2,
      nonUrgent: 4,
      urgentResolved: 1,
      urgentPending: 1,
      nonUrgentResolved: 3,
      nonUrgentPending: 1
    },
    6: {
      name: "Purok 6",
      description: "Information about Purok 6",
      residents: 190,
      complaints: 14,
      resolved: 11,
      pending: 3,
      urgent: 9,
      nonUrgent: 5,
      urgentResolved: 7,
      urgentPending: 2,
      nonUrgentResolved: 4,
      nonUrgentPending: 1
    }
  };

  const currentPurok = purokData[purokNumber];

  return (
    <div className="p-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-4 text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <FiArrowLeft />
        <span>Back to Dashboard</span>
      </button>

      {/* Purok Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{currentPurok.name}</h1>
        <p className="text-gray-600">{currentPurok.description}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Residents"
          value={currentPurok.residents}
          bgColor="bg-blue-500"
        />
        <StatCard
          title="Total Complaints"
          value={currentPurok.complaints}
          bgColor="bg-yellow-500"
        />
        <StatCard
          title="Resolved"
          value={currentPurok.resolved}
          bgColor="bg-green-500"
        />
        <StatCard
          title="Pending"
          value={currentPurok.pending}
          bgColor="bg-red-500"
        />
      </div>

      {/* Additional Content Area */}
      <div className="bg-white rounded-lg border border-slate-300 p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
        <div className="space-y-3">
          <ActivityItem 
            title="New complaint filed"
            time="2 hours ago"
            type="complaint"
          />
          <ActivityItem 
            title="Complaint resolved"
            time="1 day ago"
            type="resolved"
          />
          <ActivityItem 
            title="Barangay meeting scheduled"
            time="3 days ago"
            type="meeting"
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, bgColor }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-300 p-4">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-3`}>
        <FiMail className="text-white text-xl" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
    </div>
  );
};

const ActivityItem = ({ title, time, type }) => {
  const getTypeColor = () => {
    switch (type) {
      case 'complaint': return 'text-yellow-600';
      case 'resolved': return 'text-green-600';
      case 'meeting': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <span className={`font-medium ${getTypeColor()}`}>{title}</span>
      <span className="text-gray-500 text-sm">{time}</span>
    </div>
  );
};

export default HoverDevCards;