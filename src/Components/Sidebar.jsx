import React from 'react'
import { useNavigate } from "react-router-dom";

const Sidebar = () => {

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };
  
  return (
    <div className='w-64 h-screen bg-gray-800 text-white p-4'>
        <h2 className='text-2xl font-bold mb-4'>Sidebar</h2>
        <ul>
            <li className='mb-2'><a href="#" className='hover:underline'>Dashboard</a></li>
            <li className='mb-2'><a href="#" className='hover:underline'>Feedback</a></li>
            <li className='mb-2'><a href="#" className='hover:underline'>Settings</a></li>

            <li className="mb-2">
              {/* Logout is now a button so it can run JS */}
              <button
                onClick={handleLogout}
                className="hover:underline text-left w-full"
              >
                Logout
              </button>
            </li>
        </ul>
        
      
    </div>
  )
}

export default Sidebar
