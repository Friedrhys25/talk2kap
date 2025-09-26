import React, { useState } from 'react';
import { FiAlertCircle, FiClock, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';

const Reportanalytics = () => {
  // Sample data - replace with real data from your backend
  const [complaintData] = useState({
    urgencyLevels: {
      high: 25,
      medium: 45,
      low: 30,
    },
    monthlyComplaints: [
      { month: 'Jan', count: 45, resolved: 42 },
      { month: 'Feb', count: 52, resolved: 48 },
      { month: 'Mar', count: 38, resolved: 35 },
      { month: 'Apr', count: 65, resolved: 58 },
      { month: 'May', count: 48, resolved: 45 },
      { month: 'Jun', count: 55, resolved: 52 },
    ],
    topComplaints: [
      { type: 'Road Maintenance', count: 28, avgResolveTime: '3 days' },
      { type: 'Drainage Issues', count: 24, avgResolveTime: '2 days' },
      { type: 'Noise Complaints', count: 20, avgResolveTime: '1 day' },
      { type: 'Street Lighting', count: 18, avgResolveTime: '4 days' },
      { type: 'Waste Collection', count: 15, avgResolveTime: '2 days' },
    ],
    resolutionMetrics: {
      avgResolutionTime: '2.5 days',
      resolvedThisMonth: 85,
      pending: 12,
      satisfaction: '92%'
    }
  });

  // Calculate total complaints for percentages
  const totalUrgency = Object.values(complaintData.urgencyLevels).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gray-50">
        <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Complaints</p>
              <p className="text-2xl font-bold text-gray-800">{totalUrgency}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <FiAlertCircle className="text-indigo-600" />
            </div>
          </div>
        </div>
        {Object.entries(complaintData.urgencyLevels).map(([level, count]) => (
          <div key={level} className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {level.charAt(0).toUpperCase() + level.slice(1)} Priority
                </p>
                <p className="text-2xl font-bold text-gray-800">{count}</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                level === 'high' ? 'bg-red-100' : 
                level === 'medium' ? 'bg-yellow-100' : 
                'bg-green-100'
              }`}>
                <FiAlertCircle className={`${
                  level === 'high' ? 'text-red-600' : 
                  level === 'medium' ? 'text-yellow-600' : 
                  'text-green-600'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Urgency Level Distribution */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiAlertCircle className="text-red-500" />
          Urgency Level Distribution
        </h2>
        <div className="flex gap-4">
          {Object.entries(complaintData.urgencyLevels).map(([level, count]) => (
            <div key={level} className="flex-1">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className={`
                      text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full
                      ${level === 'high' ? 'text-red-600 bg-red-200' :
                        level === 'medium' ? 'text-yellow-600 bg-yellow-200' :
                        'text-green-600 bg-green-200'}
                    `}>
                      {level}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-600">
                      {Math.round((count / totalUrgency) * 100)}%
                    </span>
                  </div>
                </div>
                <div className=" h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${(count / totalUrgency) * 100}%` }}
                    className={`
                      shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center
                      ${level === 'high' ? 'bg-red-500' :
                        level === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'}
                    `}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-indigo-500" />
          Monthly Complaint Trends
        </h2>
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end justify-between gap-2">
            {complaintData.monthlyComplaints.map((month) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center">
                  <div 
                    className="w-full bg-indigo-500 rounded-t"
                    style={{ height: `${(month.count / 65) * 100}%` }}
                  />
                  <div 
                    className="w-full bg-green-500 opacity-50 -mt-2"
                    style={{ height: `${(month.resolved / 65) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">{month.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded" />
            <span className="text-sm text-gray-600">Total Complaints</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 opacity-50 rounded" />
            <span className="text-sm text-gray-600">Resolved</span>
          </div>
        </div>
      </div>

      {/* Top Complaints & Resolution Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiClock className="text-orange-500" />
            Top Complaints This Month
          </h2>
          <div className="space-y-4">
            {complaintData.topComplaints.map((complaint, index) => (
              <div key={complaint.type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-800">{complaint.type}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{complaint.count} cases</span>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    ~{complaint.avgResolveTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resolution Metrics */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiCheckCircle className="text-green-500" />
            Resolution Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Average Resolution Time</p>
              <p className="text-2xl font-bold text-indigo-600">
                {complaintData.resolutionMetrics.avgResolutionTime}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Resolved This Month</p>
              <p className="text-2xl font-bold text-green-600">
                {complaintData.resolutionMetrics.resolvedThisMonth}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Pending Cases</p>
              <p className="text-2xl font-bold text-yellow-600">
                {complaintData.resolutionMetrics.pending}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Satisfaction Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {complaintData.resolutionMetrics.satisfaction}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportanalytics;
