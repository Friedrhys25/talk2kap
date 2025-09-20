import React from 'react'
import HoverDevCards from '../../Components/Pagecomponents/Purokcard'
import PurokChart from '../../Components/Pagecomponents/PurokChart'

const Dashpage = () => {
  return (
    <div className='w-full h-full bg-red-500 m-0 p-0' style={{width: '100%', margin: 0, padding: 0}}>
      <div className='flex flex-col w-full h-full p-4 bg-white'>
        <div className='flex-shrink-0 mb-4 overflow-auto'>
          <HoverDevCards/>
        </div>
        <div className='flex-grow overflow-auto'>
          <PurokChart/>
        </div>
      </div>
    </div>
  )
}

export default Dashpage