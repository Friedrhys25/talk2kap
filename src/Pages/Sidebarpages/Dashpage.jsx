// Dashpage.jsx - Updated with state management
import React, { useState } from 'react';
import HoverDevCards from '../../Components/Pagecomponents/Purokcard';
import PurokChart from '../../Components/Pagecomponents/PurokChart';

const Dashpage = () => {
  const [selectedPurok, setSelectedPurok] = useState(null);

  const handlePurokSelect = (purokNumber) => {
    setSelectedPurok(purokNumber);
  };

  const handleBackToDashboard = () => {
    setSelectedPurok(null);
  };

  return (
    <div className='w-full h-full m-0 p-0' style={{width: '100%', margin: 0, padding: 0}}>
      <div className='flex flex-col w-full h-full p-4 bg-white overflow-auto'>
        <div className='flex-shrink-0 mb-4'>
          <HoverDevCards
            onPurokSelect={handlePurokSelect}
            selectedPurok={selectedPurok}
            onBackToDashboard={handleBackToDashboard}
          />
        </div>
        
        {/* Only show chart when no purok is selected */}
        {!selectedPurok && (
          <div className='flex-grow '>
            <PurokChart/>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashpage;