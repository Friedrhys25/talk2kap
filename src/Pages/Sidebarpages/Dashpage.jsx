import React from 'react'
import HoverDevCards from '../../Components/Pagecomponents/Purokcard'
import PurokChart from '../../Components/Pagecomponents/PurokChart'

const Dashpage = () => {
  return (
    <div className='flex flex-col justify-between items-center p-4 w-full h-full'>
        <HoverDevCards/>
        <PurokChart/>
    </div>
  )
}

export default Dashpage
