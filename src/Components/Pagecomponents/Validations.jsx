import React, { useState } from 'react';
import { FiCheck, FiX, FiSearch, FiUser, FiMail, FiPhone, FiMapPin, FiClock } from 'react-icons/fi';

const Validations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, declined
  const [selectedImage, setSelectedImage] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([
    {
      id: 1,
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@gmail.com',
      phone: '09123456789',
      address: 'Purok 1, Sample Street',
      dateSubmitted: '2025-09-27 09:30 AM',
      status: 'pending',
      purok: 'Purok 1',
      validId: 'National ID',
      idNumber: '1234-5678-9012',
      idImage: 'https://example.com/sample-id-1.jpg', // Replace with actual image URL
      idImageBack: 'https://example.com/sample-id-1-back.jpg' // Replace with actual image URL
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria.santos@gmail.com',
      phone: '09198765432',
      address: 'Purok 3, Main Road',
      dateSubmitted: '2025-09-27 10:15 AM',
      status: 'pending',
      purok: 'Purok 3',
      validId: 'Driver\'s License',
      idNumber: 'N01-15-123456'
    },
    // Add more sample data as needed
  ]);

  // Filter users based on search and status
  const filteredUsers = pendingUsers.filter(user => {
    const matchesFilter = filter === 'all' || user.status === filter;
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.purok.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle approve/decline
  const updateStatus = (id, newStatus) => {
    setPendingUsers(pendingUsers.map(user =>
      user.id === id ? { ...user, status: newStatus } : user
    ));
  };

  // Stats
  const stats = {
    total: pendingUsers.length,
    pending: pendingUsers.filter(u => u.status === 'pending').length,
    approved: pendingUsers.filter(u => u.status === 'approved').length,
    declined: pendingUsers.filter(u => u.status === 'declined').length
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gray-50">
        <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Registrations</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <FiUser className="text-indigo-600" />
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
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheck className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Declined</p>
              <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <FiX className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search registrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'approved' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved ({stats.approved})
            </button>
            <button
              onClick={() => setFilter('declined')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'declined' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Declined ({stats.declined})
            </button>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <FiUser className="text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.dateSubmitted}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 flex items-center gap-1">
                      <FiMail className="text-gray-400" /> {user.email}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <FiPhone className="text-gray-400" /> {user.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{user.purok}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <FiMapPin className="text-gray-400" /> {user.address}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 mb-2">{user.validId}</div>
                    <div className="text-sm text-gray-500 mb-2">{user.idNumber}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedImage(user.idImage)}
                        className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded hover:bg-indigo-200 transition-colors"
                      >
                        View Front ID
                      </button>
                      <button
                        onClick={() => setSelectedImage(user.idImageBack)}
                        className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded hover:bg-indigo-200 transition-colors"
                      >
                        View Back ID
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'approved' ? 'bg-green-100 text-green-800' :
                      user.status === 'declined' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(user.id, 'approved')}
                          className="text-green-600 hover:text-green-800 transition-colors p-1 rounded-full hover:bg-green-50"
                          title="Approve Registration"
                        >
                          <FiCheck />
                        </button>
                        <button
                          onClick={() => updateStatus(user.id, 'declined')}
                          className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-50"
                          title="Decline Registration"
                        >
                          <FiX />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg">No registrations found</div>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredUsers.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredUsers.length} of {pendingUsers.length} registrations
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">ID Preview</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedImage}
                alt="ID Preview"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Validations;
