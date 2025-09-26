import React from 'react'
import MessageTable from '../../Components/Pagecomponents/Messagetable'

const Messagepage = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Messages</h1>
        <p className="text-gray-600">View and manage community messages</p>
      </div>

      {/* Message Table Component */}
      <div className="bg-white rounded-2xl shadow p-4">
        <MessageTable />
      </div>
    </div>
  )
}

export default Messagepage
