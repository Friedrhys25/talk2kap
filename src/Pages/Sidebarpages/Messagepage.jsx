import React from 'react'
import MessageTable from '../../Components/Pagecomponents/Messagetable'

const Messagepage = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <div className="p-6 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Messages</h1>
          <p className="text-gray-600">View and manage community messages</p>
        </div>

        {/* Message Table Component */}
        <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden mb-6">
          <MessageTable />
        </div>
      </div>
    </div>
  )
}

export default Messagepage
