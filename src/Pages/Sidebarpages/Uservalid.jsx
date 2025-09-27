import React from 'react'
import Validations from '../../Components/Pagecomponents/Validations'

const Uservalid = () => {
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-gray-50">
      <div className="p-6 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Users validation</h1>
          <p className="text-gray-600">Identification for users</p>
        </div>

        {/* Notification Table Component */}
        <div className="bg-white rounded-lg  overflow-hidden mb-6">
          <Validations/>
        </div>
      </div>
    </div>
  )
}

export default Uservalid
