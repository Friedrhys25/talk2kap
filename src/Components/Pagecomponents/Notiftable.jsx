// NotifTable.jsx - Separated table component
import React, { useState } from 'react';
import { FiAlertTriangle, FiClock, FiEye, FiCheck, FiX, FiFilter, FiSearch } from 'react-icons/fi';

const NotifTable = () => {
  const [filter, setFilter] = useState('all'); // all, urgent, non-urgent
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      purok: 'Purok 1',
      complainant: 'Juan Dela Cruz',
      urgency: 'urgent',
      issue: 'medical',
      description: 'Emergency medical assistance needed for elderly resident',
      dateTime: '2024-01-15 08:30 AM',
      status: 'pending'
    },
    {
      id: 2,
      purok: 'Purok 3',
      complainant: 'Maria Santos',
      urgency: 'urgent',
      issue: 'fire',
      description: 'Small fire incident at residential area',
      dateTime: '2024-01-15 07:45 AM',
      status: 'resolved'
    },
    {
      id: 3,
      purok: 'Purok 2',
      complainant: 'Pedro Rodriguez',
      urgency: 'non-urgent',
      issue: 'noise',
      description: 'Loud music from neighbor disrupting sleep',
      dateTime: '2024-01-14 11:20 PM',
      status: 'pending'
    },
    {
      id: 4,
      purok: 'Purok 4',
      complainant: 'Ana Garcia',
      urgency: 'non-urgent',
      issue: 'waste',
      description: 'Garbage collection missed, accumulating waste',
      dateTime: '2024-01-14 09:15 AM',
      status: 'in-progress'
    },
    {
      id: 5,
      purok: 'Purok 5',
      complainant: 'Carlos Mendoza',
      urgency: 'urgent',
      issue: 'medical',
      description: 'Pregnant woman needs immediate medical attention',
      dateTime: '2024-01-14 06:30 PM',
      status: 'resolved'
    },
    {
      id: 6,
      purok: 'Purok 6',
      complainant: 'Rosa Fernandez',
      urgency: 'non-urgent',
      issue: 'infrastructure',
      description: 'Street light not working, causing safety concerns',
      dateTime: '2024-01-13 08:00 PM',
      status: 'pending'
    },
    {
      id: 7,
      purok: 'Purok 1',
      complainant: 'Miguel Torres',
      urgency: 'urgent',
      issue: 'fire',
      description: 'Electrical short circuit causing smoke',
      dateTime: '2024-01-13 02:15 PM',
      status: 'resolved'
    },
    {
      id: 8,
      purok: 'Purok 3',
      complainant: 'Lisa Reyes',
      urgency: 'non-urgent',
      issue: 'waste',
      description: 'Improper waste segregation in community area',
      dateTime: '2024-01-13 10:45 AM',
      status: 'in-progress'
    },
    {
      id: 9,
      purok: 'Purok 2',
      complainant: 'Roberto Silva',
      urgency: 'non-urgent',
      issue: 'infrastructure',
      description: 'Pothole on main road needs repair',
      dateTime: '2024-01-12 03:30 PM',
      status: 'pending'
    },
    {
      id: 10,
      purok: 'Purok 4',
      complainant: 'Carmen Lopez',
      urgency: 'urgent',
      issue: 'medical',
      description: 'Child with high fever needs immediate care',
      dateTime: '2024-01-12 01:20 AM',
      status: 'resolved'
    }
  ]);

  // Filter notifications based on urgency and search term
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.urgency === filter;
    const matchesSearch = notification.complainant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.purok.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Get urgency icon and color
  const getUrgencyDisplay = (urgency) => {
    if (urgency === 'urgent') {
      return {
        icon: <FiAlertTriangle className="text-red-500" />,
        text: 'Urgent',
        bgColor: 'bg-red-100 text-red-800',
        textColor: 'text-red-600'
      };
    } else {
      return {
        icon: <FiClock className="text-blue-500" />,
        text: 'Normal',
        bgColor: 'bg-blue-100 text-blue-800',
        textColor: 'text-blue-600'
      };
    }
  };

  // Get issue color coding
  const getIssueColor = (issue) => {
    const colors = {
      medical: 'bg-red-100 text-red-800',
      fire: 'bg-orange-100 text-orange-800',
      noise: 'bg-purple-100 text-purple-800',
      waste: 'bg-green-100 text-green-800',
      infrastructure: 'bg-gray-100 text-gray-800'
    };
    return colors[issue] || 'bg-gray-100 text-gray-800';
  };

  // Get status display
  const getStatusDisplay = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'in-progress': { color: 'bg-blue-100 text-blue-800', text: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-800', text: 'Resolved' }
    };
    return statusConfig[status] || statusConfig.pending;
  };

  // Handle status update
  const updateStatus = (id, newStatus) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, status: newStatus } : notification
    ));
  };

  // Stats for the header
  const stats = {
    total: notifications.length,
    urgent: notifications.filter(n => n.urgency === 'urgent').length,
    pending: notifications.filter(n => n.status === 'pending').length,
    resolved: notifications.filter(n => n.status === 'resolved').length
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gray-50">
        <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Urgent Cases</p>
              <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiClock className="text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheck className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('urgent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'urgent' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Urgent ({stats.urgent})
            </button>
            <button
              onClick={() => setFilter('non-urgent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'non-urgent' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Normal ({notifications.filter(n => n.urgency === 'non-urgent').length})
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Urgency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complainant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNotifications.map((notification) => {
                const urgencyDisplay = getUrgencyDisplay(notification.urgency);
                const statusDisplay = getStatusDisplay(notification.status);
                
                return (
                  <tr key={notification.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {urgencyDisplay.icon}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${urgencyDisplay.bgColor}`}>
                          {urgencyDisplay.text}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {notification.purok}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notification.complainant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getIssueColor(notification.issue)}`}>
                        {notification.issue}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={notification.description}>
                        {notification.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.dateTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusDisplay.color}`}>
                        {statusDisplay.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        {notification.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(notification.id, 'in-progress')}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Mark as In Progress"
                            >
                              <FiEye />
                            </button>
                            <button
                              onClick={() => updateStatus(notification.id, 'resolved')}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Mark as Resolved"
                            >
                              <FiCheck />
                            </button>
                          </>
                        )}
                        {notification.status === 'in-progress' && (
                          <button
                            onClick={() => updateStatus(notification.id, 'resolved')}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Mark as Resolved"
                          >
                            <FiCheck />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg">No notifications found</div>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
          </div>
        )}

        {filteredNotifications.length > 0 && (
        <div className="text-md font-bold mb-5 mt-2 text-gray-600 text-center">
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </div>
      )}
      </div>

      {/* Results Summary */}
      
    </div>
  );
};

export default NotifTable;