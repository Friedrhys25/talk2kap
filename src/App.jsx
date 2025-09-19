import { useState } from 'react'
import './App.css'
import Sidebar from './Components/Sidebar'
import Loginpage from './Pages/Loginpage'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Mainpage from './Pages/Mainpage'
import ProtectedRoute from './Components/ProtectedRoute'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Loginpage />} />


        <Route
          path="/main"
          element={
            <ProtectedRoute>
              <Mainpage />
            </ProtectedRoute>
          }
        />

        
      </Routes>
    </Router>
  )
}

export default App
